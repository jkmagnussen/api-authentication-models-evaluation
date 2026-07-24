from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]

checks = [
    ('primary/security/misconfiguration-frequency-comparison.svg', 358.8),
    ('primary/security/normalized-failure-density.svg', 373.2),
    ('primary/security/ai-vs-human-severity-gap-ci.svg', 330.0),
    ('primary/security/security-critical-control-risk-density.svg', 358.8),
    ('supporting/security/control-point-risk-heatmap.svg', 590.4),
    ('primary/synthesis/error-diversity-entropy.svg', 299.6),
]

print('Verifying optimized footnote Y positions:\n')

for path, target_y in checks:
    full_path = ROOT / 'docs/charts' / path
    content = full_path.read_text()
    
    # Find the footnote element and get its translate Y coordinate
    fn_match = re.search(r'id="text_footnote">.*?translate\(([0-9.]+) ([0-9.]+)\)', content, re.DOTALL)
    if fn_match:
        y = float(fn_match.group(2))
        status = '✓' if abs(y - target_y) < 0.2 else '✗'
        space_below = ''
        
        # Get canvas height to calculate space below
        vb = re.search(r'viewBox="[0-9.]+ [0-9.]+ ([0-9.]+) ([0-9.]+)"', content)
        if vb:
            height = float(vb.group(2))
            space = height - y
            space_below = f' (space below: {space:.0f}pt)'
        
        print(f'{status} {Path(path).name}: Y={y:.1f}pt (target: {target_y:.1f}pt){space_below}')
    else:
        print(f'✗ {Path(path).name}: Could not find footnote')

print('\n✓ All optimized positions updated successfully!' if all(
    abs(float(re.search(r'id="text_footnote">.*?translate\(([0-9.]+) ([0-9.]+)\)', 
                       (ROOT / 'docs/charts' / path).read_text(), re.DOTALL).group(2)) - target_y) < 0.2
    for path, target_y in checks
) else '\n✗ Some positions not updated correctly')
