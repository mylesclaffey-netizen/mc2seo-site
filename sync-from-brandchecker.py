#!/usr/bin/env python3
"""
Copies the LLM tools from brandchecker.eu (../brandchecker-deploy) into mc2seo.com (this folder), re-skinned for
mc2seo — so a change is made once, on brandchecker.eu, and this script brings mc2seo.com up to date.

    python3 sync-from-brandchecker.py        # then check locally, commit and push as usual

What it copies:
    tools/state-of-the-llm-union/  form, report, tracker, print
    tools/model-compare/
    assets/sotu.js, sotu-deck.js, vendor/pptxgen.bundle.js   (logic, as is apart from the site name and colours)
    assets/sotu-print.js            → the print page's light copy of sotu.js
    assets/sotu.css, theme.css      → re-skinned dark for the tool pages
    assets/sotu-print.css, theme-print.css → light, for the print page (the PDFs are printed from it)

How it re-skins: brandchecker.eu's light theme (#0a0a0a ink and borders, white panels, #ff3d00 accent, Archivo) becomes
mc2seo's dark one (Space Grotesk headings, #0a0c11 page, #12151d panels, #6e7bff accent). Colours are mapped by the CSS
property they sit in — the same near-black is text in `color:`, a panel in `background:` and a rule in `border:` — so
the brand chips' own palette (`fg: '#0a0a0a'` on light chips) is left alone. brandchecker-only extras are dropped: the
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
]
PRINT = 'tools/state-of-the-llm-union/print/index.html'

# mc2seo's palette (deploy/tools/*/index.html :root).
PAPER, CARD, CARD2, INK, MUTED, LINE, YOU = '#0a0c11', '#12151d', '#171b26', '#eceef4', '#8b93a7', '#242c3d', '#6e7bff'
OK, WARN, BAD, GOLD = '#35c48d', '#e0a93a', '#e8695f', '#ffd65c'
HEADFILL = '#232a3a'   # what brandchecker fills solid ink (table heads, solid buttons, the "you" chip)

# Colours that mean the same whatever property they're in.
FIXED = {
    '#ff3d00': YOU, '#d92f00': '#5c68f2', '#1e3cff': YOU,
    '#d40000': BAD, '#c0321f': BAD, '#9a4a2e': BAD, '#b3261e': BAD,
    '#00844a': OK, '#1b7040': OK, '#2f6b2a': OK, '#5b8c3e': '#5b8c3e',
    '#b45f00': WARN, '#ffd9cc': 'rgba(232,105,95,.22)', '#e2e2dc': LINE, '#c9c9c9': LINE, '#767676': '#6b7385',
}
RGBA = [('rgba(255,61,0,', 'rgba(110,123,255,'), ('rgba(27,112,64,', 'rgba(53,196,141,'), ('rgba(192,50,31,', 'rgba(232,105,95,')]
DARKS = r'#0a0a0a|#000000|#000\b'
LIGHTS = r'#ffffff|#fff\b'


def dark(s):
    """brandchecker light → mc2seo dark, by CSS property. Works on CSS files, <style> blocks and style strings in JS."""
    # Custom properties first (the pages' :root and theme.css).
    for k, v in {'--paper': PAPER, '--card': CARD, '--card2': CARD2, '--ink': INK, '--muted': MUTED, '--line': LINE,
                 '--you': YOU, '--ok': OK, '--warn': WARN, '--bad': BAD, '--gold': GOLD}.items():
        s = re.sub(k + r'\s*:\s*#[0-9a-fA-F]{3,6}', k + ':' + v, s)
    # The page itself.
    s = re.sub(r'(body\s*\{[^}]*?background\s*:\s*)(?:' + LIGHTS + ')', r'\1' + PAPER, s)
    # Fills: white panels → card, ink fills → a raised dark, the pale grey → card2.
    s = re.sub(r'(background(?:-color)?\s*:\s*)(?:' + LIGHTS + ')', r'\1' + CARD, s, flags=re.I)
    s = re.sub(r'(background(?:-color)?\s*:\s*)(?:' + DARKS + ')', r'\1' + HEADFILL, s, flags=re.I)
    s = re.sub(r'(--bg\s*:\s*)(?:' + DARKS + ')', r'\1' + HEADFILL, s, flags=re.I)
    s = re.sub(r'#f3f3ef', CARD2, s, flags=re.I)
    # Rules and outlines.
    s = re.sub(r'((?:border|outline)(?:-[a-z]+)*\s*:[^;"\'}{]*?)(?:' + DARKS + ')', r'\1' + LINE, s, flags=re.I)
    s = re.sub(r'(box-shadow\s*:[^;"\'}{]*?)(?:' + DARKS + ')', r'\1#000', s, flags=re.I)
    s = re.sub(r'(stroke\s*:\s*)(?:' + DARKS + ')', r'\1' + MUTED, s, flags=re.I)
    # Text: ink → light ink, the dark grey → muted. White text stays white (it sits on dark or accent fills).
    s = re.sub(r'((?<![-\w])color\s*:\s*)(?:' + DARKS + ')', r'\1' + INK, s, flags=re.I)
    s = re.sub(r'((?<![-\w])color\s*:\s*)#3d3d3d', r'\1' + MUTED, s, flags=re.I)
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
    s = re.sub(r'https://fonts\.googleapis\.com/css2\?family=Archivo[^"]*', 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap', s)
    s = s.replace("'Archivo'", "'Space Grotesk'").replace('"Archivo"', '"Space Grotesk"')
    # brandchecker-only: Make presets and the open-access visitor id.
    s = re.sub(r'\s*<script src="/assets/presets\.js"></script>', '', s)
    s = re.sub(r'\s*<script src="/assets/visitor\.js"></script>', '', s)
    # mc2seo's favicon: the gold rounded square.
    s = s.replace("rx='0' fill='%23FF3D00'", "rx='22' fill='%23ffd65c'")
    return s


def page(rel):
    s = open(os.path.join(SRC, rel), encoding='utf-8').read()
    s = brand(s)
    if rel == PRINT:
        # The print page stays light (it becomes the PDFs) with its own copies of the stylesheets and helpers.
        s = accent(s).replace('/assets/sotu.css', '/assets/sotu-print.css').replace('/assets/theme.css', '/assets/theme-print.css').replace('/assets/sotu.js', '/assets/sotu-print.js')
    else:
        s = dark(s)
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
write('assets/sotu.css', brand(dark(css('sotu.css'))))
write('assets/theme.css', brand(dark(css('theme.css'))))
write('assets/sotu-print.css', brand(accent(css('sotu.css'))))
write('assets/theme-print.css', brand(accent(css('theme.css'))))
# Logic: copied as is, apart from the site name and the accent (the slide decks and heat maps use it).
js = lambda name: open(os.path.join(SRC, 'assets', name), encoding='utf-8').read()
write('assets/sotu.js', dark(brand(js('sotu.js'))))            # its inline styles too (the brand-chip palette is untouched)
write('assets/sotu-print.js', accent(brand(js('sotu.js'))))     # the light print page's copy
write('assets/sotu-deck.js', brand(js('sotu-deck.js')).replace("ORANGE = 'FF3D00'", "ORANGE = '6E7BFF'").replace('ch(255) + ch(61) + ch(0)', 'ch(110) + ch(123) + ch(255)'))
os.makedirs(os.path.join(HERE, 'assets', 'vendor'), exist_ok=True)
shutil.copyfile(os.path.join(SRC, 'assets', 'vendor', 'pptxgen.bundle.js'), os.path.join(HERE, 'assets', 'vendor', 'pptxgen.bundle.js'))
print('wrote assets/vendor/pptxgen.bundle.js')
