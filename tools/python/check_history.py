import xml.etree.ElementTree as ET
import subprocess

files = [
    ('HEAD~2:docs/charts/primary/performance/authentication-overhead-breakdown.svg', 'v2'),
    ('HEAD~1:docs/charts/primary/performance/authentication-overhead-breakdown.svg', 'v1'),
    ('HEAD:docs/charts/primary/performance/authentication-overhead-breakdown.svg', 'current'),
]

for git_ref, label in files:
    try:
        result = subprocess.run(['git', 'show', git_ref], capture_output=True, text=True)
        content = result.stdout
        tree = ET.fromstring(content)
        print(f'{label}: Valid XML ✓')
    except ET.ParseError as e:
        print(f'{label}: XML Error at line {e.lineno}, col {e.offset}: {e.msg}')
    except Exception as e:
        print(f'{label}: Error - {e}')
