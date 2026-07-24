
# Dual Reviewer Guide

Before I submit this, I want two independent reviewers to come in cold and sanity-check different parts of the project.

This is not the full sign-off pack. It is just a practical guide so each reviewer knows what I need them to look at and where to start.

## Reviewer 1

This reviewer is checking that the AI side of the project stayed controlled and didn't leak into the baseline evaluation logic.

Start here:

- `README.md`
- `docs/REPRODUCIBILITY_CHECKLIST.md`
- `docs/generated/RESULTS_DASHBOARD.md`

Then do a quick control review:

- Make sure AI-generated material is staying under `ai-generated/`
- Make sure the baseline implementations are still under `src/`
- Run `npm run freeze:verify`
- Check `docs/generated/OFFLINE_FREEZE_LOCK.json`
- Spot-check AI metadata under `ai-generated/arms/`

I don't need this reviewer to re-argue every result. I need them to confirm that the AI workflow stayed boxed in and that the control measures make sense.

## Reviewer 2

This reviewer is checking the reproducibility side: tests, attack coverage, generated evidence, and whether the outputs actually support the conclusions.

Start here:

- `README.md`
- `docs/REPRODUCIBILITY_CHECKLIST.md`
- `docs/generated/RESULTS_DASHBOARD.md`
- `docs/performance-results/analysis.md`

Then do the main technical checks:

- Run `npm test`
- Run `npm run docs:check`
- Run `npm run freeze:verify`
- If doing the full pass, run `npm run run:all:offline`
- Spot-check `tests/attacks/` and `misconfigurations/`

I don't need this reviewer to read every file line by line. I need them to confirm that the evidence is reproducible and that the project holds up when someone else actually runs it.

## Quick Checklist

### Reviewer 1

- [ ] Read the repo overview and reproducibility notes
- [ ] Checked `README.md` and `docs/REPRODUCIBILITY_CHECKLIST.md` first
- [ ] Checked that AI-generated material stays isolated
- [ ] Spot-checked that baseline logic still lives under `src/`
- [ ] Confirmed AI outputs are being treated as artifacts, not as baseline replacements
- [ ] Checked freeze verification and lock file integrity
- [ ] Reviewed `docs/generated/OFFLINE_FREEZE_LOCK.json`
- [ ] Spot-checked AI generation metadata
- [ ] Reviewed `ai-generated/arms/` for model, prompt, and generation settings
- [ ] Confirmed the AI workflow still looks boxed in and auditable

### Reviewer 2

- [ ] Read the repo overview, dashboard, and performance summary
- [ ] Checked `README.md`, `docs/generated/RESULTS_DASHBOARD.md`, and `docs/performance-results/analysis.md`
- [ ] Ran the core validation commands
- [ ] Ran `npm test`
- [ ] Ran `npm run docs:check`
- [ ] Ran `npm run freeze:verify`
- [ ] Spot-checked attacks and misconfiguration coverage
- [ ] Reviewed `tests/attacks/` to make sure the attack coverage is real
- [ ] Reviewed `misconfigurations/` to make sure the weakened variants are actually there
- [ ] If needed, ran `npm run run:all:offline` for the full reproducibility pass
- [ ] Confirmed the evidence is reproducible at a practical level
- [ ] Confirmed the outputs still support the main conclusions at a high level

## Final Note

This file is only a guide for the reviewers. The actual review outcome and final submission decision happen separately once the review work is finished.

If I want something written down formally, I can use `docs/Reviewer_Signoff_Template.md` as the separate sign-off sheet.

