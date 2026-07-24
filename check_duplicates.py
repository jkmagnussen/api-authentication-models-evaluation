import re

files_to_check = [
    'docs/charts/security/ai-vs-human-severity-gap-ci.svg',
    'docs/charts/security/normalized-failure-density.svg',
    'docs/charts/security/security-critical-control-risk-density.svg',
    'docs/charts/synthesis/error-diversity-entropy.svg',
    'docs/charts/performance/authentication-overhead-breakdown.svg',
    'docs/charts/security/misconfiguration-frequency-comparison.svg',
]

for filepath in files_to_check:
    try:
        content = open(filepath).read()
        count = len(re.findall(r'<g id="text_footnote">', content))
        print(f'{filepath.split("/")[-1]}: {count} footnote elements')
        
        # Also check for footnotes with scale 0.95
        footnotes = re.findall(r'scale\(0.95 0.95\)', content)
        print(f'  -> scale(0.95 0.95): {len(footnotes)} occurrences')
    except Exception as e:
        print(f'{filepath}: ERROR - {e}')
