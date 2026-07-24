#!/usr/bin/env python3
"""
Comprehensive validation of all 24 enhanced charts
Checks for:
- Valid XML structure
- Exactly one footnote element
- Correct scale (0.95 0.95)
- Correct Y positioning (height - 25)
- Proper footer margin
"""

import xml.etree.ElementTree as ET
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]

ENHANCED_CHARTS = {
    'primary/security': [
        'misconfiguration-severity-heatmap.svg',
        'token-lifecycle-fragility.svg',
        'ai-failure-rates.svg',
        'security-critical-control-risk-density.svg',
        'normalized-failure-density.svg',
        'ai-vs-human-severity-gap-ci.svg',
        'ai-vs-human-dominance-heatmap.svg',
        'misconfiguration-frequency-comparison.svg',
    ],
    'supporting/security': [
        'control-point-risk-heatmap.svg',
        'stride-severity-scoring.svg',
    ],
    'primary/performance': [
        'authentication-overhead-breakdown.svg',
        'runtime-latency-comparison-ci.svg',
        'variance-under-load.svg',
    ],
    'supporting/performance': [
        'performance-comparison.svg',
    ],
    'primary/maintainability': [
        'ai-sample-syntax-issues-by-model-stage.svg',
        'complexity-vs-misconfig-frequency-regression.svg',
        'failure-points-vs-chars.svg',
        'maintainability-difficulty-index.svg',
        'code-footprint-deltas.svg',
    ],
    'supporting/maintainability': [
        'complexity-to-misconfig-regression.svg',
    ],
    'primary/synthesis': [
        'ai-determinism-variance.svg',
        'correctness-vs-security-provider-scatter.svg',
        'cross-provider-overlap-venn.svg',
        'error-diversity-entropy.svg',
        'misconfiguration-clustering-kmeans.svg',
        'calibration-and-agreement-controls.svg',
    ],
    'supporting/synthesis': [
        'correctness-security-tradeoff.svg',
        'provider-bias-analysis.svg',
    ],
}

def validate_chart(filepath, expected_height=None):
    """Validate a single chart"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Check XML validity
        try:
            tree = ET.fromstring(content)
        except ET.ParseError as e:
            return {
                'status': 'ERROR',
                'message': f'XML Parse Error at line {e.lineno}: {e.msg}',
                'height': None,
                'footnote_count': None,
                'scale': None,
                'y_position': None,
            }
        
        # Get viewBox/height
        viewbox = tree.get('viewBox', '')
        height_attr = tree.get('height', '')
        
        # Extract height from viewBox (last number) or height attribute
        height = None
        if 'pt' in height_attr:
            height = float(height_attr.replace('pt', ''))
        elif viewbox:
            parts = viewbox.split()
            if len(parts) >= 4:
                height = float(parts[3])
        
        # Count footnote elements
        footnote_groups = tree.findall('.//{http://www.w3.org/2000/svg}g[@id="text_footnote"]')
        if not footnote_groups:
            footnote_groups = tree.findall('.//{*}g[@id="text_footnote"]')
            if not footnote_groups:
                footnote_groups = tree.findall('.//g[@id="text_footnote"]')
        
        # Extract scale and Y position from footnote
        scale = None
        y_position = None
        
        if footnote_groups:
            footnote_text = ET.tostring(footnote_groups[0], encoding='unicode')
            
            # Find scale
            scale_match = re.search(r'scale\(([0-9.]+ [0-9.]+)\)', footnote_text)
            if scale_match:
                scale = scale_match.group(1)
            
            # Find translate Y position
            translate_match = re.search(r'translate\([0-9.]+ ([0-9.]+)\)', footnote_text)
            if translate_match:
                y_position = float(translate_match.group(1))
        
        # Validate
        issues = []
        
        if len(footnote_groups) != 1:
            issues.append(f'Expected 1 footnote element, found {len(footnote_groups)}')
        
        if scale and scale != '0.95 0.95':
            issues.append(f'Wrong scale: {scale} (expected 0.95 0.95)')
        
        if height and y_position:
            expected_y = height - 25
            if abs(y_position - expected_y) > 0.5:
                issues.append(f'Y position {y_position} doesn\'t match height-25={expected_y}')
        
        if issues:
            return {
                'status': 'WARNING',
                'message': '; '.join(issues),
                'height': height,
                'footnote_count': len(footnote_groups),
                'scale': scale,
                'y_position': y_position,
            }
        
        return {
            'status': 'OK',
            'message': 'Valid',
            'height': height,
            'footnote_count': len(footnote_groups),
            'scale': scale,
            'y_position': y_position,
        }
    
    except Exception as e:
        return {
            'status': 'ERROR',
            'message': str(e),
            'height': None,
            'footnote_count': None,
            'scale': None,
            'y_position': None,
        }

def main():
    print("=" * 90)
    print("COMPREHENSIVE CHART VALIDATION REPORT")
    print("=" * 90)
    
    base_path = ROOT / 'docs' / 'charts'
    total = 0
    ok_count = 0
    warning_count = 0
    error_count = 0
    
    for directory, filenames in ENHANCED_CHARTS.items():
        print(f"\n{directory.upper()} DIRECTORY ({len(filenames)} charts)")
        print("-" * 90)
        
        for filename in filenames:
            total += 1
            filepath = base_path / directory / filename
            
            result = validate_chart(filepath)
            status = result['status']
            
            if status == 'OK':
                ok_count += 1
                symbol = '✓'
            elif status == 'WARNING':
                warning_count += 1
                symbol = '⚠'
            else:
                error_count += 1
                symbol = '✗'
            
            print(f"{symbol} {filename:50} | {status:7} | {result['message']}")
            
            if result['height'] is not None:
                print(f"  Height: {result['height']:.2f}pt | Scale: {result['scale']} | Y: {result['y_position']}")
    
    print("\n" + "=" * 90)
    print(f"SUMMARY: {ok_count}/{total} OK | {warning_count}/{total} Warnings | {error_count}/{total} Errors")
    print("=" * 90)
    
    return 0 if error_count == 0 else 1

if __name__ == '__main__':
    exit(main())
