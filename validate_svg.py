import xml.etree.ElementTree as ET

files = [
    'docs/charts/performance/authentication-overhead-breakdown.svg',
    'docs/charts/security/misconfiguration-frequency-comparison.svg',
    'docs/charts/synthesis/misconfiguration-clustering-kmeans.svg',
]

for f in files:
    try:
        tree = ET.parse(f)
        root = tree.getroot()
        print(f'{f.split("/")[-1]}: Valid XML ✓')
    except ET.ParseError as e:
        print(f'{f.split("/")[-1]}: XML Error - {e}')
    except Exception as e:
        print(f'{f.split("/")[-1]}: Error - {e}')
