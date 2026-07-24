import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

files_to_check = [
    ROOT / 'docs/charts/primary/security/ai-vs-human-severity-gap-ci.svg',
    ROOT / 'docs/charts/primary/security/normalized-failure-density.svg',
    ROOT / 'docs/charts/primary/security/security-critical-control-risk-density.svg',
    ROOT / 'docs/charts/primary/synthesis/error-diversity-entropy.svg',
    ROOT / 'docs/charts/primary/performance/authentication-overhead-breakdown.svg',
    ROOT / 'docs/charts/primary/security/misconfiguration-frequency-comparison.svg',
]

for filepath in files_to_check:
    try:
        content = filepath.read_text(encoding='utf-8')
        count = len(re.findall(r'<g id="text_footnote">', content))
        print(f'{filepath.name}: {count} footnote elements')
        
        # Also check for footnotes with scale 0.95
        footnotes = re.findall(r'scale\(0.95 0.95\)', content)
        print(f'  -> scale(0.95 0.95): {len(footnotes)} occurrences')
    except Exception as e:
        print(f'{filepath}: ERROR - {e}')
