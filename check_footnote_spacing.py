"""Check current footnote positioning in charts."""

import xml.etree.ElementTree as ET
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CHARTS_DIR = ROOT / "docs" / "charts"

charts_to_check = [
    CHARTS_DIR / "security" / "misconfiguration-frequency-comparison.svg",
    CHARTS_DIR / "performance" / "performance-comparison.svg",
    CHARTS_DIR / "synthesis" / "error-diversity-entropy.svg",
    CHARTS_DIR / "maintainability" / "code-footprint-deltas.svg",
    CHARTS_DIR / "security" / "stride-severity-scoring.svg",
]

ns = {'svg': 'http://www.w3.org/2000/svg'}

for chart in charts_to_check:
    if not chart.exists():
        continue
    
    tree = ET.parse(chart)
    root = tree.getroot()
    
    # Get canvas dimensions from viewBox
    viewbox = root.get('viewBox', '')
    if viewbox:
        parts = viewbox.split()
        if len(parts) >= 4:
            width, height = float(parts[2]), float(parts[3])
            print(f'{chart.name}:')
            print(f'  Canvas: {width:.1f}pt x {height:.1f}pt')
            
            # Find text_footnote
            footnote = root.find(".//svg:g[@id='text_footnote']", ns)
            if footnote is not None:
                g = footnote.find('./svg:g', ns)
                if g is not None:
                    transform = g.get('transform', '')
                    if 'translate' in transform:
                        match = re.search(r'translate\(([0-9.]+) ([0-9.]+)\)', transform)
                        if match:
                            x, y = float(match.group(1)), float(match.group(2))
                            space_below = height - y
                            scale_match = re.search(r'scale\(([0-9.]+)', transform)
                            scale = float(scale_match.group(1)) if scale_match else 1.0
                            
                            # Estimate text height (10px font * 0.95 scale ≈ 9.5pt, with padding ~15pt)
                            est_text_height = 10 * scale + 5
                            
                            print(f'  Footnote Y: {y:.1f}pt')
                            print(f'  Scale: {scale}')
                            print(f'  Space below: {space_below:.1f}pt')
                            print(f'  Est. text height: {est_text_height:.1f}pt')
                            
                            if space_below < 25:
                                print(f'  ⚠ WARNING: Tight spacing, may be cut off')
                            elif space_below > 40:
                                print(f'  ℹ Note: Extra space available, could be tighter')
            print()
