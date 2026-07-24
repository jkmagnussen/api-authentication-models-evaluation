"""
Post-process SVG charts to inject standardized footnotes.

Run this script after generate_charts.py to add custom footnotes to all charts.
Footnotes are sourced from FOOTNOTES configuration below.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "docs"
CHARTS_DIR = DOCS_DIR / "charts"

# Footnote configuration: chart_name -> footnote config
# y_position and scale are optional (use defaults if omitted)
FOOTNOTES = {
    # Maintainability Charts
    "ai-sample-syntax-issues-by-model-stage.svg": {
        "text": "AI code generation: syntax error frequency by development stage and authentication model",
        "directory": "maintainability",
        "scale": 0.95,
    },
    "code-footprint-deltas.svg": {
        "text": "Code footprint analysis: metric differences across authentication implementations",
        "directory": "maintainability",
        "scale": 0.95,
    },
    "complexity-to-misconfig-regression.svg": {
        "text": "Code complexity correlation: cyclomatic complexity and misconfiguration density relationship",
        "directory": "maintainability",
        "scale": 0.95,
    },
    "complexity-vs-misconfig-frequency-regression.svg": {
        "text": "Complexity regression: code complexity vs. misconfiguration frequency across models",
        "directory": "maintainability",
        "scale": 0.95,
    },
    "failure-points-vs-chars.svg": {
        "text": "Failure density normalized: failure event frequency per unit of implementation size",
        "directory": "maintainability",
        "scale": 0.95,
    },
    "maintainability-difficulty-index.svg": {
        "text": "Maintainability metrics: difficulty index across authentication model implementations",
        "directory": "maintainability",
        "scale": 0.95,
    },
    # Performance Charts
    "authentication-overhead-breakdown.svg": {
        "text": "Performance overhead: latency contribution by authentication phase under normal load",
        "directory": "performance",
        "scale": 0.95,
    },
    "performance-comparison.svg": {
        "text": "Performance metrics: latency and throughput comparison across authentication models",
        "directory": "performance",
        "scale": 0.95,
    },
    "runtime-latency-comparison-ci.svg": {
        "text": "Runtime latency: mean response time with 95% confidence intervals by authentication model",
        "directory": "performance",
        "scale": 0.95,
    },
    "variance-under-load.svg": {
        "text": "Performance stability: latency variance under sustained load conditions",
        "directory": "performance",
        "scale": 0.95,
    },
    # Security Charts
    "ai-failure-rates.svg": {
        "text": "AI-generated code quality: failure rate by provider and authentication model",
        "directory": "security",
        "scale": 0.95,
    },
    "ai-vs-human-dominance-heatmap.svg": {
        "text": "AI vs. human-written code: security outcome comparison across authentication implementations",
        "directory": "security",
        "scale": 0.95,
    },
    "ai-vs-human-severity-gap-ci.svg": {
        "text": "Severity-weighted risk gap: AI-generated code risk score with 95% bootstrap confidence intervals",
        "directory": "security",
        "scale": 0.95,
        "y_position": 330.0,
    },
    "control-point-risk-heatmap.svg": {
        "text": "Security control risk matrix: vulnerability severity and control effectiveness assessment",
        "directory": "security",
        "scale": 0.95,
        "y_position": 590.4,
    },
    "misconfiguration-frequency-comparison.svg": {
        "text": "Frequency comparison: occurrence of misconfiguration types across authentication models",
        "directory": "security",
        "scale": 0.95,
        "y_position": 358.8,
    },
    "misconfiguration-severity-heatmap.svg": {
        "text": "Severity assessment: exploitability and remediation complexity across misconfiguration types",
        "directory": "security",
        "scale": 0.95,
    },
    "normalized-failure-density.svg": {
        "text": "Failure density: normalized event frequency per 10,000 lines across code sources",
        "directory": "security",
        "scale": 0.95,
        "y_position": 373.2,
    },
    "security-critical-control-risk-density.svg": {
        "text": "Critical control failure density: security event frequency by authentication model",
        "directory": "security",
        "scale": 0.95,
        "y_position": 358.8,
    },
    "stride-severity-scoring.svg": {
        "text": "STRIDE threat model: severity scoring by threat category and authentication model",
        "directory": "security",
        "scale": 0.95,
    },
    "token-lifecycle-fragility.svg": {
        "text": "Token lifecycle vulnerabilities: session lifetime and refresh patterns across authentication models",
        "directory": "security",
        "scale": 0.95,
    },
    # Synthesis Charts
    "ai-determinism-variance.svg": {
        "text": "AI output determinism: consistency analysis across repeated generations and models",
        "directory": "synthesis",
        "scale": 0.95,
    },
    "calibration-and-agreement-controls.svg": {
        "text": "Checker calibration: agreement metrics for security control verification",
        "directory": "synthesis",
        "scale": 0.95,
    },
    "correctness-security-tradeoff.svg": {
        "text": "Correctness vs. security: comparative performance analysis across AI providers",
        "directory": "synthesis",
        "scale": 0.95,
    },
    "correctness-vs-security-provider-scatter.svg": {
        "text": "Provider comparison: correctness and security trade-off across AI code generators",
        "directory": "synthesis",
        "scale": 0.95,
    },
    "cross-provider-overlap-venn.svg": {
        "text": "Provider coverage: shared and unique failure patterns across AI code generation services",
        "directory": "synthesis",
        "scale": 0.95,
    },
    "error-diversity-entropy.svg": {
        "text": "Failure observations by provider: sample distribution across AI implementation variants",
        "directory": "synthesis",
        "scale": 0.95,
        "y_position": 299.6,
    },
    "misconfiguration-clustering-kmeans.svg": {
        "text": "K-means clustering of misconfiguration types by pattern similarity and severity",
        "directory": "synthesis",
        "scale": 1.1,
        "y_position": 665,
    },
    "provider-bias-analysis.svg": {
        "text": "Provider analysis: failure mode distribution and bias assessment across AI services",
        "directory": "synthesis",
        "scale": 0.95,
    },
}


def get_canvas_height(svg_content: str) -> float:
    """Extract canvas height from SVG viewBox."""
    match = re.search(r'viewBox="[0-9.]+ [0-9.]+ [0-9.]+ ([0-9.]+)"', svg_content)
    if match:
        return float(match.group(1))
    return 700.0  # Default fallback


def calculate_y_position(canvas_height: float, bottom_margin: float = 25) -> float:
    """Calculate Y position for footnote (bottom_margin from bottom)."""
    return canvas_height - bottom_margin


def create_footnote_element(text: str, canvas_width: float, canvas_height: float, scale: float = 0.95, y_position: float = None) -> str:
    """Create SVG footnote element with standardized styling."""
    if y_position is None:
        y_position = calculate_y_position(canvas_height)
    
    center_x = canvas_width / 2
    
    footnote_xml = f'''  <g id="text_footnote">
   <!-- {text[:60]}... -->
   <g style="fill: #262626" transform="translate({center_x} {y_position}) scale({scale} {scale})">
    <text x="0" y="0" style="font-family: Arial; font-size: 10px; letter-spacing: 0.5px; font-style: italic; text-anchor: middle;">{text}</text>
   </g>
  </g>
'''
    return footnote_xml


def extract_viewbox(svg_content: str) -> tuple[float, float]:
    """Extract width and height from SVG viewBox."""
    match = re.search(r'viewBox="[0-9.]+ [0-9.]+ ([0-9.]+) ([0-9.]+)"', svg_content)
    if match:
        return float(match.group(1)), float(match.group(2))
    return 800.0, 600.0  # Default fallback


def inject_footnote(svg_path: Path, footnote_text: str, scale: float = 0.95, y_position: float = None) -> bool:
    """
    Inject footnote into SVG file.
    Replaces existing footnote if present to ensure consistent formatting.
    Returns True if successful, False otherwise.
    """
    try:
        svg_content = svg_path.read_text(encoding="utf-8")
        
        # Remove existing footnote if present
        svg_content = re.sub(
            r'\s*<g id="text_footnote">.*?</g>\s*',
            '',
            svg_content,
            flags=re.DOTALL
        )
        
        # Extract canvas dimensions
        canvas_width, canvas_height = extract_viewbox(svg_content)
        
        # Create footnote element
        footnote_elem = create_footnote_element(
            footnote_text,
            canvas_width,
            canvas_height,
            scale,
            y_position
        )
        
        # Insert before closing </svg> tag
        updated_content = svg_content.replace("</svg>", f"{footnote_elem}</svg>")
        
        svg_path.write_text(updated_content, encoding="utf-8")
        print(f"  ✓ Injected: {footnote_text[:60]}...")
        return True
        
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


def main() -> None:
    """Inject all configured footnotes into charts."""
    print("Injecting footnotes into generated charts...\n")
    
    total = len(FOOTNOTES)
    success = 0
    
    for chart_name, config in FOOTNOTES.items():
        chart_dir = CHARTS_DIR / config["directory"]
        svg_path = chart_dir / chart_name
        
        if not svg_path.exists():
            print(f"✗ {chart_name}: File not found at {svg_path}")
            continue
        
        print(f"Processing {config['directory']}/{chart_name}")
        
        result = inject_footnote(
            svg_path,
            config["text"],
            config.get("scale", 0.95),
            config.get("y_position")
        )
        
        if result:
            success += 1
        print()
    
    print(f"\nSummary: {success}/{total} footnotes injected successfully")


if __name__ == "__main__":
    main()
