from pathlib import Path
import re

CHARTS_DIR = Path('docs/charts')

print("Checking footnote spacing in charts...\n")

for svg_file in sorted(CHARTS_DIR.rglob('*.svg'))[:8]:
    content = svg_file.read_text()
    
    # Get viewBox dimensions
    vb = re.search(r'viewBox="[0-9.]+ [0-9.]+ ([0-9.]+) ([0-9.]+)"', content)
    if not vb:
        continue
    
    width, height = float(vb.group(1)), float(vb.group(2))
    
    # Find footnote Y position
    fn = re.search(r'translate\(([0-9.]+) ([0-9.]+)\) scale\(([0-9.]+)', content)
    if fn:
        x, y, scale = float(fn.group(1)), float(fn.group(2)), float(fn.group(3))
        space = height - y
        status = "✓" if 18 < space < 50 else "!" if space < 18 else "⊘"
        print(f'{status} {svg_file.name}')
        print(f'  Canvas height: {height:.0f}pt, Footnote Y: {y:.0f}pt, Space below: {space:.0f}pt')
    else:
        print(f'✗ {svg_file.name}: no footnote')
    print()
