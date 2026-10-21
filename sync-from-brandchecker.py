#!/usr/bin/env python3
"""
Copies the LLM tools from brandchecker.eu (../brandchecker-deploy) into mc2seo.com (this folder), re-skinned for
mc2seo — so a change is made once, on brandchecker.eu, and this script brings mc2seo.com up to date.

    python3 sync-from-brandchecker.py        # then check locally, commit and push as usual

What it copies:
    tools/state-of-the-llm-union/  form, report, tracker, print
    tools/model-compare/
    tools/pricing-check/, tools/vs-gap/, tools/review-presence/, tools/integration-check/, tools/b2b-diagnostic/, tools/conquest-check/, tools/review-echo/, tools/brand-share/   (open on brandchecker.eu; on mc2seo they run on the access code like the rest)
    tools/price-visibility/, tools/price-localisation/, tools/trust-check/, tools/key-pages/, tools/docs-ai/, tools/schema-pack/   (free tools on both sites)
    assets/sotu.js, sotu-deck.js, vendor/pptxgen.bundle.js   (logic, as is apart from the site name and colours)
    assets/sotu-print.js            → the print page's light copy of sotu.js
    assets/sotu.css                 → re-skinned to mc2seo's light look for the tool pages
    assets/sotu-print.css, theme-print.css → for the print page (the PDFs are printed from it)

How it re-skins: brandchecker.eu's look (#0a0a0a ink and hard 2–3px borders, offset block shadows, square corners,
#ff3d00 accent, Archivo) becomes mc2seo's (Plus Jakarta Sans / Inter / JetBrains Mono, #0f172a ink, #e5e7eb hairlines,
rounded corners, no block shadows, #4f5bd5 accent). Colours are mapped by the CSS property they sit in — the same
near-black is text in `color:`, a fill in `background:` and a rule in `border:` — so the brand chips' own palette
(`fg: '#0a0a0a'` on light chips) is left alone. brandchecker's structural theme.css is NOT copied for the tool pages:
they load mc2seo's own /assets/mc2-tool.css last instead (the same file the hand-written tool pages use). brandchecker-only extras are dropped: the
Make presets (assets/presets.js) and the open-access visitor id (assets/visitor.js — mc2seo tools run on access codes).

Not synced: Brand Builder (brandchecker's changes are Make pre-fills and open access only) and the /tools/ shell's cards,
which are hand-written — update the card text in tools/index.html when a tool gains something worth saying.
"""
import os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'brandchecker-deploy')

PAGES = [
    'tools/state-of-the-llm-union/index.html',
    'tools/state-of-the-llm-union/report/index.html',
    'tools/state-of-the-llm-union/tracker/index.html',
    'tools/state-of-the-llm-union/print/index.html',
    'tools/model-compare/index.html',
    'tools/pricing-check/index.html',
    'tools/vs-gap/index.html',
    'tools/review-presence/index.html',
    'tools/integration-check/index.html',
    'tools/b2b-diagnostic/index.html',
    'tools/conquest-check/index.html',
    'tools/review-echo/index.html',
    'tools/brand-share/index.html',
    'tools/price-visibility/index.html',
    'tools/price-localisation/index.html',
    'tools/trust-check/index.html',
    'tools/key-pages/index.html',
    'tools/docs-ai/index.html',
    'tools/schema-pack/index.html',   # free: no access code on either site
]
PRINT = 'tools/state-of-the-llm-union/print/index.html'

# mc2seo's palette (assets/mc2-tool.css :root).
PAPER, CARD, CARD2, INK, MUTED, LINE, YOU = '#ffffff', '#f8fafc', '#f1f5f9', '#0f172a', '#64748b', '#e5e7eb', '#4f5bd5'
OK, WARN, BAD, GOLD = '#15803d', '#a15c07', '#b42318', '#0f172a'
HEADFILL = INK   # what brandchecker fills solid ink (table heads, solid buttons, the "you" chip)

# Colours that mean the same whatever property they're in.
FIXED = {
    '#ff3d00': YOU, '#d92f00': '#3a45b8', '#1e3cff': YOU, '#ffe14d': '#fde68a',
    '#d40000': BAD, '#c0321f': BAD, '#9a4a2e': BAD, '#b3261e': BAD,
    '#00844a': OK, '#1b7040': OK, '#2f6b2a': OK, '#5b8c3e': '#5b8c3e',
    '#34517a': YOU,   # "your brand" in the shared chip palette (path indigo) takes mc2seo's own accent
    '#b45f00': WARN, '#ffd9cc': '#fdecea', '#e2e2dc': LINE, '#c9c9c9': '#d7dbe2', '#767676': '#94a3b8',
}
RGBA = [('rgba(255,61,0,', 'rgba(79,91,213,'), ('rgba(27,112,64,', 'rgba(21,128,61,'), ('rgba(192,50,31,', 'rgba(180,35,24,')]
DARKS = r'#0a0a0a|#000000|#000\b'
LIGHTS = r'#ffffff|#fff\b'


def light(s):
    """brandchecker's look → mc2seo's light one, by CSS property. Works on CSS files, <style> blocks and style strings in JS."""
    # Custom properties first (the pages' :root).
    for k, v in {'--paper': PAPER, '--card': CARD, '--card2': CARD2, '--ink': INK, '--muted': MUTED, '--line': LINE,
                 '--you': YOU, '--ok': OK, '--warn': WARN, '--bad': BAD, '--gold': GOLD}.items():
        s = re.sub(k + r'\s*:\s*#[0-9a-fA-F]{3,6}', k + ':' + v, s)
    # Structure: offset block shadows go, heavy rules become hairlines, square corners get rounded, 900 weights calm down.
    s = re.sub(r'box-shadow\s*:\s*-?\d+px\s+-?\d+px\s+0\s+(?:#[0-9a-fA-F]{3,6}|var\(--[a-z0-9-]+\))', 'box-shadow:none', s)
    s = re.sub(r'((?:border|outline)(?:-(?:top|right|bottom|left))?\s*:\s*)[23]px(\s+solid\s+)(?:' + DARKS + ')', r'\g<1>1px\g<2>' + LINE, s, flags=re.I)
    s = re.sub(r'border-radius\s*:\s*0(?=\s*[;}"\'!])', 'border-radius:8px', s)
    s = re.sub(r'font-weight\s*:\s*900', 'font-weight:700', s)
    # Fills: white panels stay white, ink fills stay ink (mc2seo's), the pale grey → card2.
    s = re.sub(r'(background(?:-color)?\s*:\s*)(?:' + DARKS + ')', r'\1' + HEADFILL, s, flags=re.I)
    s = re.sub(r'(--bg\s*:\s*)(?:' + DARKS + ')', r'\1' + HEADFILL, s, flags=re.I)
    s = re.sub(r'#f3f3ef', CARD2, s, flags=re.I)
    # Remaining rules and outlines → hairlines.
    s = re.sub(r'((?:border|outline)(?:-[a-z]+)*\s*:[^;"\'}{]*?)(?:' + DARKS + ')', r'\1' + LINE, s, flags=re.I)
    s = re.sub(r'(stroke\s*:\s*)(?:' + DARKS + ')', r'\1' + MUTED, s, flags=re.I)
    # Text: ink → mc2seo ink, the dark grey → muted.
    s = re.sub(r'((?<![-\w])color\s*:\s*)(?:' + DARKS + ')', r'\1' + INK, s, flags=re.I)
    s = re.sub(r'#3d3d3d', MUTED, s, flags=re.I)
    return accent(s)


def accent(s):
    """brandchecker's accent and status colours → mc2seo's (also used for the light print page)."""
    for k, v in FIXED.items():
        s = re.sub(re.escape(k) + r'(?![0-9a-fA-F])', v, s, flags=re.I)
    for a, b in RGBA:
        s = s.replace(a, b)
    return s


def brand(s):
    """Names, addresses and fonts."""
    s = s.replace('https://brandchecker.eu', 'https://mc2seo.com').replace('brandchecker.eu', 'mc2seo.com')
    s = s.replace('— Brand Checker', '— MC2SEO').replace('| Brand Checker', '| MC2SEO').replace('content="Brand Checker"', 'content="MC2SEO"')
    s = re.sub(r'https://fonts\.googleapis\.com/css2\?family=Archivo[^"]*', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap', s)
    s = s.replace("'Archivo'", "'Plus Jakarta Sans'").replace('"Archivo"', '"Plus Jakarta Sans"')
    s = s.replace("'IBM Plex Mono'", "'JetBrains Mono'").replace('"IBM Plex Mono"', '"JetBrains Mono"')
    # brandchecker-only: Make presets and the open-access visitor id.
    s = re.sub(r'\s*<script src="/assets/presets\.js"></script>', '', s)
    s = re.sub(r'\s*<script src="/assets/visitor\.js"></script>', '', s)
    # mc2seo's favicon: the indigo rounded square.
    s = re.sub(r"rx='0' fill='%23[0-9A-Fa-f]{6}'", "rx='22' fill='%234f5bd5'", s)
    return s


def page(rel):
    s = open(os.path.join(SRC, rel), encoding='utf-8').read()
    s = brand(s)
    if rel in ('tools/pricing-check/index.html', 'tools/vs-gap/index.html', 'tools/review-presence/index.html', 'tools/integration-check/index.html', 'tools/b2b-diagnostic/index.html', 'tools/conquest-check/index.html', 'tools/review-echo/index.html', 'tools/brand-share/index.html'):
        # No open-access visitor id here: the code comes from the link (?k=) or the one saved by the other tools.
        s = s.replace("window.MC_VISITOR || ''", "(function () { try { return localStorage.getItem('mc2seo_code') || ''; } catch (e) { return ''; } })()")
    if rel == PRINT:
        # The print page stays light (it becomes the PDFs) with its own copies of the stylesheets and helpers.
        s = accent(s).replace('/assets/sotu.css', '/assets/sotu-print.css').replace('/assets/theme.css', '/assets/theme-print.css').replace('/assets/sotu.js', '/assets/sotu-print.js')
    else:
        s = light(s)
        # mc2seo's own structural stylesheet replaces brandchecker's theme.css, loaded last so it wins ties.
        s = s.replace('<link rel="stylesheet" href="/assets/theme.css">\n', '')
        # ...and the "Want us to fix this?" audit box under each result (mc2seo only; it skips non-result pages itself).
        MC2 = '<link rel="stylesheet" href="/assets/mc2-tool.css">\n<script src="/assets/mc2-fixit.js" defer></script>'
        if '/assets/sotu.css">' in s:
            s = s.replace('<link rel="stylesheet" href="/assets/sotu.css">', '<link rel="stylesheet" href="/assets/sotu.css">\n' + MC2, 1)
        else:
            s = s.replace('</style>', '</style>\n' + MC2, 1)
        # Colours passed as plain arguments rather than CSS: the report's "how reliably you're named" bar.
        s = s.replace("seg(con.always, '#0a0a0a', '#fff'", "seg(con.always, '%s', '#fff'" % HEADFILL).replace("seg(con.never, '%s', '#0a0a0a'" % CARD2, "seg(con.never, '%s', '%s'" % (CARD2, INK))
        # Public pages are indexed on mc2seo.com; reports, trackers and print views stay out of search.
        if rel in ('tools/state-of-the-llm-union/index.html', 'tools/model-compare/index.html'):
            s = s.replace('<meta name="robots" content="noindex, nofollow">\n', '')
    return s


def write(rel, text):
    path = os.path.join(HERE, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(text)
    print('wrote', rel)


for rel in PAGES:
    write(rel, page(rel))

css = lambda name: open(os.path.join(SRC, 'assets', name), encoding='utf-8').read()
write('assets/sotu.css', brand(light(css('sotu.css'))))
write('assets/sotu-print.css', brand(accent(css('sotu.css'))))
write('assets/theme-print.css', brand(accent(css('theme.css'))))
# Logic: copied as is, apart from the site name and the accent (the slide decks and heat maps use it).
js = lambda name: open(os.path.join(SRC, 'assets', name), encoding='utf-8').read()
write('assets/sotu.js', light(brand(js('sotu.js'))))            # its inline styles too (the brand-chip palette is untouched)
write('assets/sotu-print.js', accent(brand(js('sotu.js'))))     # the light print page's copy
write('assets/sotu-deck.js', brand(js('sotu-deck.js')).replace("ACCENT_DEFAULT = 'FF3D00'", "ACCENT_DEFAULT = '4F5BD5'").replace('ch(255) + ch(61) + ch(0)', 'ch(79) + ch(91) + ch(213)'))
os.makedirs(os.path.join(HERE, 'assets', 'vendor'), exist_ok=True)
shutil.copyfile(os.path.join(SRC, 'assets', 'vendor', 'pptxgen.bundle.js'), os.path.join(HERE, 'assets', 'vendor', 'pptxgen.bundle.js'))
print('wrote assets/vendor/pptxgen.bundle.js')

# The comparison-keyword panel for the rank pages (styled by each page's own CSS variables, so the same file serves both sites).
shutil.copyfile(os.path.join(SRC, 'assets', 'saas-keywords.js'), os.path.join(HERE, 'assets', 'saas-keywords.js'))
print('wrote assets/saas-keywords.js')
