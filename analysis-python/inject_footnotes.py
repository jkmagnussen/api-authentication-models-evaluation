"""
Post-process SVG charts to inject standardized footnotes.

Run this script after generate_charts.py to add custom footnotes to all charts.
Footnotes are sourced from FOOTNOTES configuration below.
"""

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "docs"
CHARTS_DIR = DOCS_DIR / "charts"
FOOTER_LAYOUT_LOCK_FILE = DOCS_DIR / "generated" / "FOOTER_LAYOUT_LOCK.json"
FOOTER_BAND = 90.0
FOOTER_TEXT_COLOR = "#6b7280"
FOOTER_BG_COLOR = "#ffffff"
FOOTER_FONT_SIZE = 10
FOOTER_FONT_FAMILY = "Arial"
FOOTER_FONT_STYLE = "italic"
FOOTER_PADDING_X = 8
FOOTER_PADDING_Y = 4
FOOTER_CHAR_WIDTH = 5.6
COMPACT_FOOTERS = True
COMPACT_DEFAULT_VERTICAL_SHIFT = -10.0

# Footnote configuration: chart_name -> footnote config.
# This is the persisted source of truth for footer text/formatting.
# Re-run this script to regenerate all SVG footer output with identical rules.
# Supported optional per-chart keys:
# - scale (legacy field, retained for compatibility)
# - y_position (ignored by current bottom-band placement logic)
# - force_two_lines (force at least two wrapped lines)
# - force_three_lines (force three wrapped lines)
# - vertical_shift (chart-specific Y offset adjustment)
# - compact_vertical_shift (chart-specific Y offset in compact mode)
FOOTNOTES = {
    # Maintainability Charts
    "ai-sample-syntax-issues-by-model-stage.svg": {
        "text": "Shows syntax error frequency by development stage and authentication model, highlighting where AI-generated implementations fail before runtime security testing.",
        "directory": "maintainability",
        "scale": 0.95,
    },
    "code-footprint-deltas.svg": {
        "text": "Shows code footprint deltas across authentication implementations, including relative shifts in lines, branches, and structural complexity versus baseline code.",
        "directory": "maintainability",
        "scale": 0.95,
        "compact_vertical_shift": -18.0,
    },
    "complexity-to-misconfig-regression.svg": {
        "text": "Shows the regression between cyclomatic complexity and misconfiguration density, quantifying whether more complex variants produce higher security misconfiguration rates.",
        "directory": "maintainability",
        "scale": 0.95,
    },
    "complexity-vs-misconfig-frequency-regression.svg": {
        "text": "Shows how implementation complexity tracks with misconfiguration frequency across models, indicating whether complexity amplifies operational security failure likelihood.",
        "directory": "maintainability",
        "scale": 0.95,
    },
    "failure-points-vs-chars.svg": {
        "text": "Shows normalized failure-event frequency against implementation size, separating code-length effects from true concentration of correctness and security failures.",
        "directory": "maintainability",
        "scale": 0.95,
    },
    "maintainability-difficulty-index.svg": {
        "text": "Shows maintainability difficulty index scores across authentication implementations, combining complexity and maintainability signals into a comparable risk-oriented index.",
        "directory": "maintainability",
        "scale": 0.95,
    },
    # Performance Charts
    "authentication-overhead-breakdown.svg": {
        "text": "Shows latency overhead contribution by authentication phase under baseline load, identifying which control steps dominate end-to-end authentication cost.",
        "directory": "performance",
        "scale": 0.95,
    },
    "performance-comparison.svg": {
        "text": "Shows side-by-side latency and throughput comparison across authentication models, providing direct performance trade-off context for architecture selection.",
        "directory": "performance",
        "scale": 0.95,
    },
    "runtime-latency-comparison-ci.svg": {
        "text": "Shows mean runtime latency with 95% confidence intervals by authentication model, making uncertainty and overlap explicit for comparative claims.",
        "directory": "performance",
        "scale": 0.95,
        "compact_vertical_shift": -22.0,
    },
    "variance-under-load.svg": {
        "text": "Shows latency variance under sustained load, emphasizing stability and jitter behavior that may be hidden by average latency alone.",
        "directory": "performance",
        "scale": 0.95,
    },
    # Security Charts
    "ai-failure-rates.svg": {
        "text": "Shows AI-generated implementation failure rates by provider and authentication model, summarizing quality drift and security-relevant breakage patterns.",
        "directory": "security",
        "scale": 0.95,
    },
    "ai-vs-human-dominance-heatmap.svg": {
        "text": "Shows AI-versus-human security outcomes across authentication implementations, indicating where baseline human code remains safer or where parity appears.",
        "directory": "security",
        "scale": 0.95,
        "compact_vertical_shift": -20.0,
    },
    "ai-vs-human-severity-gap-ci.svg": {
        "text": "Shows the severity-weighted risk gap for AI-generated code with 95% bootstrap confidence intervals, separating direction of risk from estimation uncertainty.",
        "directory": "security",
        "scale": 0.95,
        "compact_vertical_shift": -50.0,
        "y_position": 330.0,
    },
    "control-point-risk-heatmap.svg": {
        "text": "Shows security control-point risk levels from vulnerability severity and control effectiveness, mapping which controls contribute most to exploitable exposure.",
        "directory": "security",
        "scale": 0.95,
        "force_three_lines": True,
        "vertical_shift": -64.0,
        "compact_vertical_shift": -65.0,
        "y_position": 590.4,
    },
    "misconfiguration-frequency-comparison.svg": {
        "text": "Shows misconfiguration failure-rate frequency by authentication model and code source, contrasting AI-generated outputs with misconfigured variant behavior.",
        "directory": "security",
        "scale": 0.95,
        "compact_vertical_shift": -55.0,
        "y_position": 358.8,
    },
    "misconfiguration-severity-heatmap.svg": {
        "text": "Shows comparative misconfiguration severity using exploitability and remediation difficulty, highlighting high-impact weaknesses that remain costly to correct.",
        "directory": "security",
        "scale": 0.95,
    },
    "normalized-failure-density.svg": {
        "text": "Shows normalized failure-event density per 10,000 lines across code sources, enabling fair comparison independent of implementation length.",
        "directory": "security",
        "scale": 0.95,
        "compact_vertical_shift": -55.0,
        "y_position": 373.2,
    },
    "security-critical-control-risk-density.svg": {
        "text": "Shows critical control risk density by authentication model across compared code sources, emphasizing concentration of failures in high-severity control paths.",
        "directory": "security",
        "scale": 0.95,
        "compact_vertical_shift": -60.0,
        "y_position": 358.8,
    },
    "stride-severity-scoring.svg": {
        "text": "Shows STRIDE threat severity scoring by threat category and authentication model, clarifying which attack classes drive the observed security burden.",
        "directory": "security",
        "scale": 0.95,
        "compact_vertical_shift": -8.0,
    },
    "token-lifecycle-fragility.svg": {
        "text": "Shows token lifecycle fragility from session lifetime and refresh behavior across models, exposing revocation and expiration weak points.",
        "directory": "security",
        "scale": 0.95,
        "compact_vertical_shift": -8.0,
    },
    # Synthesis Charts
    "ai-determinism-variance.svg": {
        "text": "Shows AI output determinism by comparing repeat-generation consistency across models, indicating reproducibility limits for security-critical code generation.",
        "directory": "synthesis",
        "scale": 0.95,
    },
    "calibration-and-agreement-controls.svg": {
        "text": "Shows checker calibration and agreement metrics used for security-control verification quality, supporting confidence in downstream evaluation judgments.",
        "directory": "synthesis",
        "scale": 0.95,
        "compact_vertical_shift": -6.0,
    },
    "correctness-security-tradeoff.svg": {
        "text": "Shows the correctness-versus-security trade-off across AI providers, making performance on functional tests interpretable alongside security outcomes.",
        "directory": "synthesis",
        "scale": 0.95,
    },
    "correctness-vs-security-provider-scatter.svg": {
        "text": "Shows provider-level correctness and security positioning in a trade-off scatter view, revealing clusters of balanced versus risky provider behavior.",
        "directory": "synthesis",
        "scale": 0.95,
    },
    "cross-provider-overlap-venn.svg": {
        "text": "Shows shared versus unique failure-pattern coverage across AI code-generation providers, separating common systemic issues from provider-specific weaknesses.",
        "directory": "synthesis",
        "scale": 0.95,
    },
    "error-diversity-entropy.svg": {
        "text": "Shows failure-category diversity and sample distribution across AI provider variants, where higher entropy indicates less predictable error structure.",
        "directory": "synthesis",
        "scale": 0.95,
        "y_position": 299.6,
    },
    "misconfiguration-clustering-kmeans.svg": {
        "text": "Shows K-means clustering of misconfiguration types by similarity and severity profile, helping identify recurring risk families across controls.",
        "directory": "synthesis",
        "scale": 1.1,
        "compact_vertical_shift": -35.0,
        "force_two_lines": True,
        "y_position": 665,
    },
    "provider-bias-analysis.svg": {
        "text": "Shows provider bias through comparative failure-mode distribution across AI services, highlighting skew toward specific classes of implementation errors.",
        "directory": "synthesis",
        "scale": 0.95,
    },
}

# Short numeric cues appended to each footer for faster interpretation.
FOOTER_NUMERIC_CUES = {
    # Maintainability
    "ai-sample-syntax-issues-by-model-stage.svg": "Unit: percentages of sampled outputs per development stage.",
    "code-footprint-deltas.svg": "Baseline: deltas are measured relative to baseline implementation metrics.",
    "complexity-to-misconfig-regression.svg": "Interpretation: trendline summarizes complexity versus misconfiguration-rate relationship.",
    "complexity-vs-misconfig-frequency-regression.svg": "Scale: higher y-values indicate larger misconfiguration frequency.",
    "failure-points-vs-chars.svg": "Unit: x-axis is code size and y-axis is normalized failure concentration.",
    "maintainability-difficulty-index.svg": "Scale: normalization uses a 171-point maintainability ceiling.",
    # Performance
    "authentication-overhead-breakdown.svg": "Unit: segment values represent phase contribution to total latency.",
    "performance-comparison.svg": "Unit: latency and throughput are direct model-level comparisons.",
    "runtime-latency-comparison-ci.svg": "CI: error bars represent 95% confidence intervals.",
    "variance-under-load.svg": "Interpretation: higher variance indicates wider latency spread under repeated load.",
    # Security
    "ai-failure-rates.svg": "Unit: failure rates are percentages of tested generated samples.",
    "ai-vs-human-dominance-heatmap.svg": "Scale: binary cell outcomes mark which side is safer per comparison.",
    "ai-vs-human-severity-gap-ci.svg": "Baseline: 0 risk-gap; CI: 95% bootstrap intervals.",
    "control-point-risk-heatmap.svg": "Scale: cell intensity encodes relative control-point risk magnitude.",
    "misconfiguration-frequency-comparison.svg": "Baseline: 0% by design and omitted from plotted bars.",
    "misconfiguration-severity-heatmap.svg": "Scale: cells are scored on a comparable severity scale.",
    "normalized-failure-density.svg": "Baseline: 0 by design; Unit: rates per 10,000 lines.",
    "security-critical-control-risk-density.svg": "Baseline: 0 by design; Unit: weighted risk density per 10k chars.",
    "stride-severity-scoring.svg": "Scale: scores are plotted on the same threat-severity range.",
    "token-lifecycle-fragility.svg": "Interpretation: higher values indicate greater lifecycle fragility.",
    # Synthesis
    "ai-determinism-variance.svg": "Interpretation: lower variance indicates higher generation determinism.",
    "calibration-and-agreement-controls.svg": "Unit: agreement rates and calibration sensitivity are shown as percentages.",
    "correctness-security-tradeoff.svg": "Interpretation: position reflects correctness-security balance across providers.",
    "correctness-vs-security-provider-scatter.svg": "Scale: quadrant position indicates relative correctness and security standing.",
    "cross-provider-overlap-venn.svg": "Unit: set counts quantify shared versus unique failure patterns.",
    "error-diversity-entropy.svg": "Interpretation: higher entropy means less predictable failure categories.",
    "misconfiguration-clustering-kmeans.svg": "Unit: cluster groupings reflect numeric similarity in risk-feature space.",
    "provider-bias-analysis.svg": "Unit: distribution percentages indicate provider skew by failure mode.",
}


def get_canvas_height(svg_content: str) -> float:
    """Extract canvas height from SVG viewBox."""
    match = re.search(r'viewBox="[0-9.]+ [0-9.]+ [0-9.]+ ([0-9.]+)"', svg_content)
    if match:
        return float(match.group(1))
    return 700.0  # Default fallback


def calculate_y_position(canvas_height: float, bottom_margin: float = 8) -> float:
    """Place footer close to the SVG bottom edge to avoid plot-label overlap."""
    return canvas_height - bottom_margin


def _format_num(value: float) -> str:
    text = f"{value:.6f}".rstrip("0").rstrip(".")
    return text if text else "0"


def add_footer_band(svg_content: str, footer_band: float = FOOTER_BAND) -> str:
    """Ensure SVG canvas has the configured footer band height."""

    viewbox_match = re.search(r'viewBox="([0-9.]+) ([0-9.]+) ([0-9.]+) ([0-9.]+)"', svg_content)
    height_match = re.search(r'height="([0-9.]+)([a-z%]*)"', svg_content)
    band_match = re.search(r'data-footer-band="([0-9.]+)"', svg_content)

    if not viewbox_match or not height_match:
        return svg_content

    vb_x = float(viewbox_match.group(1))
    vb_y = float(viewbox_match.group(2))
    vb_w = float(viewbox_match.group(3))
    vb_h = float(viewbox_match.group(4))
    existing_band = float(band_match.group(1)) if band_match else 0.0

    if abs(existing_band - footer_band) < 1e-6:
        return svg_content

    delta_band = footer_band - existing_band

    new_vb_h = vb_h + delta_band
    new_viewbox = f'viewBox="{_format_num(vb_x)} {_format_num(vb_y)} {_format_num(vb_w)} {_format_num(new_vb_h)}"'
    svg_content = svg_content.replace(viewbox_match.group(0), new_viewbox, 1)

    h_value = float(height_match.group(1))
    h_unit = height_match.group(2)
    scale = h_value / vb_h if vb_h > 0 else 1.0
    new_h_value = h_value + (delta_band * scale)
    new_height = f'height="{_format_num(new_h_value)}{h_unit}"'
    svg_content = svg_content.replace(height_match.group(0), new_height, 1)

    if band_match:
        svg_content = re.sub(
            r'data-footer-band="[0-9.]+"',
            f'data-footer-band="{_format_num(footer_band)}"',
            svg_content,
            count=1,
        )
    else:
        svg_content = svg_content.replace("<svg ", f'<svg data-footer-band="{_format_num(footer_band)}" ', 1)
    return svg_content


def _tighten_compact_text(text: str) -> str:
    """Shorten phrasing while preserving meaning for compact footers."""
    replacements = [
        (r"\bAI-generated\b", "AI gen"),
        (r"\bprovider-level\b", "provider"),
        (r"\bauthentication\b", "auth"),
        (r"\bimplementations\b", "impls"),
        (r"\bimplementation\b", "impl"),
        (r"\bmisconfiguration\b", "misconfig"),
        (r"\bversus\b", "vs"),
        (r"\bconfidence intervals\b", "CIs"),
        (r"\bpercentages\b", "%"),
        (r"\bpercentage\b", "%"),
        (r"\bdistribution\b", "dist"),
        (r"\bconcentration\b", "concentration"),
        (r"\bcategories\b", "categories"),
        (r"\bcategory\b", "category"),
        (r"\bwith\s+95%\s+bootstrap\s+CIs\b", "(95% bootstrap CI)"),
        (r"\bacross\s+compared\s+code\s+sources\b", "across code sources"),
        (r"\bwhere\s+higher\b", "higher"),
        (r"\bused\s+for\b", "for"),
        (r"\bin\s+a\s+trade-off\s+scatter\s+view\b", "in trade-off scatter"),
        (r"\bacross\s+code\s+sources\b", "across sources"),
    ]
    compact = text
    for pattern, repl in replacements:
        compact = re.sub(pattern, repl, compact, flags=re.IGNORECASE)
    compact = re.sub(r"\s*;\s*", "; ", compact)
    compact = re.sub(r"\s*,\s*", ", ", compact)
    compact = re.sub(r"\s+", " ", compact).strip()
    return compact


def _build_compact_footer_text(base_text: str, cue_text: str) -> str:
    """Build shorter compact footer text while retaining detail fields."""
    # Keep the first clause for dense readability, then append a compressed cue.
    base = re.sub(r"^Shows\s+", "", base_text, flags=re.IGNORECASE).rstrip(".")
    base = base.split(",", 1)[0].strip()
    base = _tighten_compact_text(base)

    # Trim long lead-ins while keeping understandable context.
    base_words = base.split()
    if len(base_words) > 13:
        base = " ".join(base_words[:13])

    cue_clean = _tighten_compact_text(cue_text.rstrip("."))
    cue_label_map = {
        "Unit": "Unit",
        "Baseline": "Base",
        "CI": "CI",
        "Scale": "Scale",
        "Interpretation": "Meaning",
    }
    if ":" in cue_clean:
        label, value = cue_clean.split(":", 1)
        label = cue_label_map.get(label.strip(), label.strip())
        cue_compact = f"{label}: {value.strip()}"
    else:
        cue_compact = cue_clean

    return f"{base}. {cue_compact}."


def write_footer_layout_lock(resolved_configs: dict[str, dict[str, object]]) -> None:
    """Persist resolved footer placement/style so reruns stay locked to current layout."""
    lock_payload = {
        "global": {
            "compact": COMPACT_FOOTERS,
            "defaultCompactVerticalShift": COMPACT_DEFAULT_VERTICAL_SHIFT,
            "footerBand": FOOTER_BAND,
            "fontFamily": FOOTER_FONT_FAMILY,
            "fontSize": FOOTER_FONT_SIZE,
            "fontStyle": FOOTER_FONT_STYLE,
            "textColor": FOOTER_TEXT_COLOR,
        },
        "charts": {},
    }

    for chart_name, config in resolved_configs.items():
        lock_payload["charts"][chart_name] = {
            "directory": config.get("directory"),
            "compactVerticalShift": config.get("compact_vertical_shift", COMPACT_DEFAULT_VERTICAL_SHIFT),
            "verticalShift": config.get("vertical_shift", 0.0),
            "forceTwoLines": config.get("force_two_lines", False),
            "forceThreeLines": config.get("force_three_lines", False),
        }

    FOOTER_LAYOUT_LOCK_FILE.parent.mkdir(parents=True, exist_ok=True)
    FOOTER_LAYOUT_LOCK_FILE.write_text(json.dumps(lock_payload, indent=2), encoding="utf-8")


def create_footnote_element(
    text: str,
    canvas_width: float,
    canvas_height: float,
    scale: float = 0.95,
    y_position: float = None,
    footer_font_size: int = FOOTER_FONT_SIZE,
    force_two_lines: bool = False,
    force_three_lines: bool = False,
    vertical_shift: float = 0.0,
) -> str:
    """Create uniformly styled SVG footnote element."""
    center_x = canvas_width / 2

    max_text_width = max(180.0, canvas_width - 48.0)
    char_width = FOOTER_CHAR_WIDTH * (float(footer_font_size) / float(FOOTER_FONT_SIZE))
    words = text.split()
    lines = [text]
    estimated_width = len(text) * char_width

    max_lines = 2 if COMPACT_FOOTERS else 3

    # Wrap footer text into up to max_lines when width requires it.
    if (force_two_lines or force_three_lines or estimated_width > max_text_width) and len(words) > 1:
        wrapped: list[str] = []
        current: list[str] = []
        for word in words:
            candidate = " ".join(current + [word])
            if not current or (len(candidate) * char_width) <= max_text_width:
                current.append(word)
            else:
                wrapped.append(" ".join(current))
                current = [word]
        if current:
            wrapped.append(" ".join(current))

        if len(wrapped) > max_lines:
            if max_lines == 2:
                lines = [wrapped[0], " ".join(wrapped[1:])]
            else:
                lines = wrapped[:2] + [" ".join(wrapped[2:])]
        else:
            lines = wrapped

        if (not COMPACT_FOOTERS) and force_three_lines and len(lines) < 3:
            # Re-split into three balanced lines.
            best_split = None
            best_score = float("inf")
            for i in range(1, len(words) - 1):
                for j in range(i + 1, len(words)):
                    a = " ".join(words[:i])
                    b = " ".join(words[i:j])
                    c = " ".join(words[j:])
                    widths = [len(a) * char_width, len(b) * char_width, len(c) * char_width]
                    overflow_penalty = sum(max(0.0, w - max_text_width) * 10.0 for w in widths)
                    balance_penalty = max(widths) - min(widths)
                    score = overflow_penalty + balance_penalty
                    if score < best_score:
                        best_score = score
                        best_split = [a, b, c]
            if best_split:
                lines = best_split

        if force_two_lines and len(lines) < 2:
            midpoint = max(1, len(words) // 2)
            lines = [" ".join(words[:midpoint]), " ".join(words[midpoint:])]

        if (not COMPACT_FOOTERS) and force_three_lines and len(lines) > 3:
            lines = lines[:2] + [" ".join(lines[2:])]

        if len(lines) > max_lines:
            if max_lines == 2:
                lines = [lines[0], " ".join(lines[1:])]
            else:
                lines = lines[:2] + [" ".join(lines[2:])]

        if len(lines) > 3:
            lines = lines[:2] + [" ".join(lines[2:])]

    safe_lines = [html.escape(line) for line in lines]
    longest_line_width = max(len(line) * char_width for line in lines)
    text_width = min(max_text_width, max(180.0, longest_line_width))
    box_width = text_width + (2 * FOOTER_PADDING_X)
    line_count = len(lines)
    if line_count == 1:
        box_height = footer_font_size + (2 * FOOTER_PADDING_Y)
    else:
        box_height = int(round((footer_font_size * (1.2 * line_count)) + (2 * FOOTER_PADDING_Y)))
    box_x = -(box_width / 2)
    box_y = -(box_height / 2)

    # Move footer up by reducing the drop distance within the footer band.
    image_bottom_y = canvas_height - FOOTER_BAND
    bottom_inset = 3.0 if line_count > 1 else 2.0
    max_drop_inside_band = max(0.0, FOOTER_BAND - box_height - bottom_inset)
    top_offset = max_drop_inside_band * (0.02 if COMPACT_FOOTERS else 0.25)
    y_position = image_bottom_y + (box_height / 2.0) + top_offset + vertical_shift

    min_center = (box_height / 2.0) + 1.0
    max_center = canvas_height - (box_height / 2.0) - 1.0
    y_position = min(max(y_position, min_center), max_center)

    if line_count == 1:
        text_markup = safe_lines[0]
    else:
        start_dy = -0.55 * (line_count - 1)
        tspans = [f'<tspan x="0" dy="{start_dy:.2f}em">{safe_lines[0]}</tspan>']
        for line in safe_lines[1:]:
            tspans.append(f'<tspan x="0" dy="1.10em">{line}</tspan>')
        text_markup = "".join(tspans)

    footnote_xml = f'''  <g id="text_footnote">
   <!-- {text[:60]}... -->
   <g transform="translate({center_x} {y_position}) scale(1 1)">
    <rect x="{box_x}" y="{box_y}" width="{box_width}" height="{box_height}" style="fill: {FOOTER_BG_COLOR};"/>
    <text x="0" y="0" dominant-baseline="middle" style="fill: {FOOTER_TEXT_COLOR}; font-family: {FOOTER_FONT_FAMILY}; font-size: {footer_font_size}px; font-style: {FOOTER_FONT_STYLE}; text-anchor: middle;">{text_markup}</text>
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


def inject_footnote(
    svg_path: Path,
    footnote_text: str,
    scale: float = 0.95,
    y_position: float = None,
    footer_font_size: int = FOOTER_FONT_SIZE,
    force_two_lines: bool = False,
    force_three_lines: bool = False,
    vertical_shift: float = 0.0,
) -> bool:
    """
    Inject footnote into SVG file.
    Replaces existing footnote if present to ensure consistent formatting.
    Returns True if successful, False otherwise.
    """
    try:
        svg_content = svg_path.read_text(encoding="utf-8")
        
        # Remove any previous footnote block (legacy and current formats).
        svg_content = re.sub(
            r'\s*<g id="text_footnote">.*?</g>\s*</g>\s*',
            '',
            svg_content,
            flags=re.DOTALL
        )

        # Repair known malformed tail from earlier footer injections where
        # a dangling </g> appears right after </defs>.
        svg_content = re.sub(
            r'</defs>\s*</g>\s*(?=</svg>|<g id="text_footnote">)',
            '</defs>\n',
            svg_content,
            flags=re.DOTALL,
        )

        # Strip generator source-note text groups so they never compete with
        # the standardized footer treatment.
        svg_content = re.sub(
            r'\s*<g id="text_\d+"[^>]*>\s*<!--\s*[Ss]ource:.*?-->.*?</g>\s*',
            '',
            svg_content,
            flags=re.DOTALL,
        )

        # Strip explanatory baseline-omitted notes so standardized footers are
        # the only narrative annotation layer in chart exports.
        svg_content = re.sub(
            r'\s*<g id="text_\d+"[^>]*>\s*<!--\s*Properly implemented baseline fails.*?-->.*?</g>\s*',
            '',
            svg_content,
            flags=re.DOTALL,
        )
        svg_content = re.sub(
            r'\s*<g id="text_\d+"[^>]*>\s*<!--\s*Baseline scores 0 on all models.*?-->.*?</g>\s*',
            '',
            svg_content,
            flags=re.DOTALL,
        )
        svg_content = re.sub(
            r'\s*<g id="text_\d+"[^>]*>\s*<!--\s*Baseline.*?scores\s*0.*?omitted.*?-->.*?</g>\s*',
            '',
            svg_content,
            flags=re.DOTALL,
        )

        # Reserve a dedicated footer band so footnotes never overlap plot labels.
        svg_content = add_footer_band(svg_content)
        
        # Extract canvas dimensions
        canvas_width, canvas_height = extract_viewbox(svg_content)
        
        # Create footnote element
        footnote_elem = create_footnote_element(
            footnote_text,
            canvas_width,
            canvas_height,
            scale,
            y_position,
            footer_font_size,
            force_two_lines,
            force_three_lines,
            vertical_shift,
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
    resolved_configs: dict[str, dict[str, object]] = {}
    
    for chart_name, config in FOOTNOTES.items():
        resolved_configs[chart_name] = dict(config)
        chart_dir = CHARTS_DIR / config["directory"]
        svg_path = chart_dir / chart_name
        
        if not svg_path.exists():
            print(f"✗ {chart_name}: File not found at {svg_path}")
            continue
        
        print(f"Processing {config['directory']}/{chart_name}")

        cue = FOOTER_NUMERIC_CUES.get(chart_name, "Scale: values are shown on a consistent numeric scale")

        if COMPACT_FOOTERS:
            full_text = _build_compact_footer_text(config["text"], cue)
        else:
            full_text = f"{config['text']} Key numeric cue: {cue.rstrip('.')}" + "."

        footer_font_size = FOOTER_FONT_SIZE
        force_two = config.get("force_two_lines", False)
        force_three = config.get("force_three_lines", False)
        vertical_shift = config.get("vertical_shift", 0.0)

        if COMPACT_FOOTERS:
            force_three = False
            vertical_shift = config.get("compact_vertical_shift", COMPACT_DEFAULT_VERTICAL_SHIFT)
        
        result = inject_footnote(
            svg_path,
            full_text,
            config.get("scale", 0.95),
            config.get("y_position"),
            footer_font_size,
            force_two,
            force_three,
            vertical_shift,
        )
        
        if result:
            success += 1
        print()
    
    print(f"\nSummary: {success}/{total} footnotes injected successfully")
    write_footer_layout_lock(resolved_configs)
    print(f"Layout lock written: {FOOTER_LAYOUT_LOCK_FILE}")


if __name__ == "__main__":
    main()
