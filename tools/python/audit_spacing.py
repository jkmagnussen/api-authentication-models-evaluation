from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
CHARTS_DIR = ROOT / 'docs' / 'charts'

print('Checking all 28 charts for spacing...\n')

tight = []
good = []
spacious = []

for svg_file in sorted(CHARTS_DIR.rglob('*.svg')):
    try:
        content = svg_file.read_text()
        
        # Get viewBox dimensions
        vb = re.search(r'viewBox="[0-9.]+ [0-9.]+ ([0-9.]+) ([0-9.]+)"', content)
        if not vb:
            continue
        
        width, height = float(vb.group(1)), float(vb.group(2))
        
        # Find footnote Y position
        fn = re.search(r'translate\([0-9.]+ ([0-9.]+)\) scale\(([0-9.]+)', content)
        if fn:
            y, scale = float(fn.group(1)), float(fn.group(2))
            space = height - y
            
            if space < 20:
                tight.append((svg_file.name, space))
            elif space > 40:
                spacious.append((svg_file.name, space))
            else:
                good.append((svg_file.name, space))
    except Exception as e:
        print(f"Error processing {svg_file.name}: {e}")

print(f'✓ Good spacing (20-40pt): {len(good)} charts')
print(f'⊘ Spacious (>40pt): {len(spacious)} charts')
print(f'! Tight (<20pt): {len(tight)} charts')

if spacious:
    print('\nCharts with extra space (could tighten):')
    for name, space in sorted(spacious, key=lambda x: -x[1]):
        print(f'  {name}: {space:.0f}pt')

if tight:
    print('\nCharts with tight spacing (risk of cutoff):')
    for name, space in sorted(tight):
        print(f'  {name}: {space:.0f}pt')

print(f'\nTotal charts checked: {len(good) + len(spacious) + len(tight)}')
