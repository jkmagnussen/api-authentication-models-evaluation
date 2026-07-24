#!/usr/bin/env python3
"""
Final comprehensive check of all enhanced charts
Verify:
1. XML well-formedness for each file
2. All required footnote elements present
3. Footnote styling correct
4. File integrity (not truncated or corrupted)
"""

import xml.etree.ElementTree as ET
from pathlib import Path
import re

ENHANCED_CHARTS = {
    'security': [
        'control-point-risk-heatmap.svg',
        'misconfiguration-severity-heatmap.svg',
        'stride-severity-scoring.svg',
        'token-lifecycle-fragility.svg',
        'ai-failure-rates.svg',
        'security-critical-control-risk-density.svg',
        'normalized-failure-density.svg',
        'ai-vs-human-severity-gap-ci.svg',
    ],
    'performance': [
        'authentication-overhead-breakdown.svg',
        'runtime-latency-comparison-ci.svg',
        'variance-under-load.svg',
        'performance-comparison.svg',
    ],
    'maintainability': [
        'ai-sample-syntax-issues-by-model-stage.svg',
        'complexity-to-misconfig-regression.svg',
        'complexity-vs-misconfig-frequency-regression.svg',
        'failure-points-vs-chars.svg',
        'maintainability-difficulty-index.svg',
    ],
    'synthesis': [
        'ai-determinism-variance.svg',
        'correctness-security-tradeoff.svg',
        'correctness-vs-security-provider-scatter.svg',
        'cross-provider-overlap-venn.svg',
        'error-diversity-entropy.svg',
        'misconfiguration-clustering-kmeans.svg',
        'provider-bias-analysis.svg',
    ],
}

def check_chart(filepath):
    """Perform comprehensive check on a single chart"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check 1: XML well-formedness
        try:
            tree = ET.fromstring(content)
        except ET.ParseError as e:
            return {
                'valid': False,
                'reason': f'XML Parse Error: {e.msg}',
                'details': {},
            }
        
        # Check 2: File integrity (ends with closing tag)
        if not content.rstrip().endswith('</svg>'):
            return {
                'valid': False,
                'reason': 'File not properly closed (missing </svg>)',
                'details': {},
            }
        
        # Check 3: Footnote element present and correct
        footnote_elements = tree.findall('.//{http://www.w3.org/2000/svg}g[@id="text_footnote"]')
        if not footnote_elements:
            footnote_elements = tree.findall('.//g[@id="text_footnote"]')
        
        if not footnote_elements:
            return {
                'valid': False,
                'reason': 'Missing footnote element',
                'details': {},
            }
        
        # Convert to string for further checks
        svg_content = content
        
        # Check 4: Verify scale and positioning
        scale_match = re.search(r'scale\(0\.95\s+0\.95\)', svg_content)
        if not scale_match:
            return {
                'valid': False,
                'reason': 'Footnote has incorrect scale',
                'details': {},
            }
        
        # Check 5: Verify Arial font
        font_match = re.search(r'font-family:\s*Arial', svg_content)
        if not font_match:
            return {
                'valid': False,
                'reason': 'Footnote has incorrect font',
                'details': {},
            }
        
        # Check 6: Verify size and styling
        style_match = re.search(
            r'font-size:\s*10px.*?font-style:\s*italic.*?text-anchor:\s*middle',
            svg_content,
            re.DOTALL
        )
        if not style_match:
            return {
                'valid': False,
                'reason': 'Footnote has incorrect styling',
                'details': {},
            }
        
        # Extract details for reporting
        viewbox = tree.get('viewBox', '').split()
        height = tree.get('height', 'unknown')
        
        return {
            'valid': True,
            'reason': 'OK',
            'details': {
                'height': height,
                'viewBox': tree.get('viewBox', 'unknown'),
                'size_bytes': len(content),
            },
        }
    
    except Exception as e:
        return {
            'valid': False,
            'reason': f'Error: {str(e)}',
            'details': {},
        }

def main():
    print("=" * 90)
    print("FINAL COMPREHENSIVE CHECK OF ENHANCED CHARTS")
    print("=" * 90)
    
    base_path = Path('docs/charts')
    total = 0
    passed = 0
    failed = 0
    failures = []
    
    for directory, filenames in sorted(ENHANCED_CHARTS.items()):
        print(f"\n{directory.upper()}")
        print("-" * 90)
        
        for filename in sorted(filenames):
            total += 1
            filepath = base_path / directory / filename
            
            result = check_chart(filepath)
            
            if result['valid']:
                passed += 1
                print(f"✓ {filename}")
            else:
                failed += 1
                print(f"✗ {filename} - {result['reason']}")
                failures.append((filename, result['reason']))
    
    print("\n" + "=" * 90)
    print(f"RESULTS: {passed}/{total} PASSED | {failed}/{total} FAILED")
    print("=" * 90)
    
    if failures:
        print("\nFAILURES:")
        for filename, reason in failures:
            print(f"  - {filename}: {reason}")
        return 1
    else:
        print("\n✓ ALL CHARTS VALID AND PROPERLY FORMATTED")
        print("✓ All footnotes present and correctly styled")
        print("✓ All XML files well-formed and complete")
        return 0

if __name__ == '__main__':
    exit(main())
