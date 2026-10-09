#!/usr/bin/env python3
"""Regenerate sitemap.xml for mc2seo.com. Run after adding or removing a page:

    python3 build-sitemap.py

Every index.html in the site is listed, except pages marked noindex and the few in EXCLUDE (pages that are empty
without a report id, or personal to each visitor). <lastmod> is the date of the page's last git commit. robots.txt
points to the result."""
import os, re, subprocess

BASE = 'https://mc2seo.com'
EXCLUDE = {'/tools/history/', '/tools/brand-builder/report/'}

pages = []
for root, dirs, files in os.walk('.'):
    dirs[:] = sorted(d for d in dirs if not d.startswith('.') and d != 'node_modules')
    if 'index.html' not in files:
        continue
    path = '/' + os.path.relpath(root, '.').replace(os.sep, '/') + '/'
    path = '/' if path == '/./' else path
    html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
    if path in EXCLUDE or re.search(r'<meta[^>]+name="robots"[^>]+noindex', html, re.I):
        continue
    date = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', os.path.join(root, 'index.html')],
                          capture_output=True, text=True).stdout.strip()
    pages.append((path, date))

pages.sort(key=lambda p: (p[0] != '/', p[0] != '/tools/', p[0]))
out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for path, date in pages:
    out.append('  <url><loc>' + BASE + path + '</loc>' + ('<lastmod>' + date + '</lastmod>' if date else '') + '</url>')
out.append('</urlset>')
open('sitemap.xml', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('wrote sitemap.xml with %d pages' % len(pages))
