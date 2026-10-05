from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text(encoding='utf-8')
js = (root / 'app.js').read_text(encoding='utf-8')

html_ids = re.findall(r'id="([^"]+)"', html)
counts = {}
for x in html_ids:
    counts[x] = counts.get(x, 0) + 1

duplicates = [k for k,v in counts.items() if v > 1]
assert not duplicates, f'IDs duplicados: {duplicates}'

refs = set()
for m in re.finditer(r"\$\((['\"])(#[^'\"]+)\1\)", js):
    selector = m.group(2)
    if re.fullmatch(r'#[A-Za-z0-9_-]+', selector):
        refs.add(selector[1:])
missing = sorted(refs - set(html_ids))
assert not missing, f'IDs referenciados no JS e ausentes no HTML: {missing}'

required = ['analytics.js','roadmap.js','app.js','config.js','styles.css']
for asset in required:
    assert f'./{asset}' in html, f'Asset não referenciado: {asset}'

print(f'static.test.py: passed ({len(html_ids)} ids, {len(refs)} refs checked)')
