# Python Utility Scripts

This folder contains ad hoc maintenance and validation scripts used during chart/layout refinement.

## Script Index

- `audit_spacing.py`: scans chart SVGs and reports footer spacing distribution.
- `calc_positions.py`: calculates candidate footer Y positions for selected charts.
- `check_duplicates.py`: checks for duplicate injected footnote blocks in selected charts.
- `check_footnote_spacing.py`: inspects footer placement and estimated spacing on selected charts.
- `check_footnote_structure.py`: prints XML structure of the `text_footnote` group for one chart.
- `check_history.py`: validates XML well-formedness of historical chart versions via `git show`.
- `check_spacing.py`: quick spot-check of chart footer spacing.
- `final_check.py`: comprehensive final validation across primary/supporting chart sets.
- `validate_all_charts.py`: legacy-style bulk validation of chart XML and footer constraints.
- `validate_svg.py`: quick XML parse check for selected SVG files.
- `verify_positions.py`: verifies configured footer Y positions against expected targets.

## Notes

- These scripts are utility/debug tools, not part of the main reproducibility pipeline.
- Paths are now aligned to the chart tier structure under `docs/charts/primary` and `docs/charts/supporting`.
