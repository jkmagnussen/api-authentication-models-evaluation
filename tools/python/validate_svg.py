import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

files = [
    ROOT / 'docs/charts/primary/performance/authentication-overhead-breakdown.svg',
    ROOT / 'docs/charts/primary/security/misconfiguration-frequency-comparison.svg',
    ROOT / 'docs/charts/primary/synthesis/misconfiguration-clustering-kmeans.svg',
]

for f in files:
    try:
        tree = ET.parse(f)
        root = tree.getroot()
        print(f'{f.name}: Valid XML ✓')
    except ET.ParseError as e:
        print(f'{f.name}: XML Error - {e}')
    except Exception as e:
        print(f'{f.name}: Error - {e}')
