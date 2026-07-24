"""Calculate optimized Y positions for spacious charts."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
CHARTS_DIR = ROOT / 'docs' / 'charts'

# Charts that need adjustment (from audit)
charts_to_adjust = {
    'misconfiguration-frequency-comparison.svg': 'primary/security',
    'normalized-failure-density.svg': 'primary/security',
    'ai-vs-human-severity-gap-ci.svg': 'primary/security',
    'security-critical-control-risk-density.svg': 'primary/security',
    'control-point-risk-heatmap.svg': 'supporting/security',
    'error-diversity-entropy.svg': 'primary/synthesis',
}

TARGET_SPACE_BELOW = 30  # Target 30pt of space below footnote

print("Optimized Y positions for spacious charts:\n")

for chart_name, directory in charts_to_adjust.items():
    chart_path = CHARTS_DIR / directory / chart_name
    
    if not chart_path.exists():
        print(f"✗ {chart_name}: File not found")
        continue
    
    content = chart_path.read_text()
    
    # Get canvas height from viewBox
    vb = re.search(r'viewBox="[0-9.]+ [0-9.]+ ([0-9.]+) ([0-9.]+)"', content)
    if not vb:
        print(f"✗ {chart_name}: No viewBox found")
        continue
    
    canvas_height = float(vb.group(2))
    
    # Calculate new Y position to have TARGET_SPACE_BELOW at bottom
    new_y_position = canvas_height - TARGET_SPACE_BELOW
    
    # Get current position
    fn = re.search(r'translate\([0-9.]+ ([0-9.]+)\) scale\(([0-9.]+)', content)
    if fn:
        current_y = float(fn.group(1))
        current_scale = float(fn.group(2))
        current_space = canvas_height - current_y
        
        print(f'{chart_name}:')
        print(f'  Canvas height: {canvas_height:.1f}pt')
        print(f'  Current Y: {current_y:.1f}pt (space below: {current_space:.1f}pt)')
        print(f'  New Y:     {new_y_position:.1f}pt (space below: {TARGET_SPACE_BELOW:.1f}pt)')
        print(f'  Add to config: "y_position": {new_y_position:.1f},')
        print()
