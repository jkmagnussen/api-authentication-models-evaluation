# Appendix: Run Health (Proof Run)

Date: 23 July 2026  
Execution command: `npm run startup`  
Result: Completed successfully with exit code 0.

This proof run completed the end-to-end dissertation pipeline, including database setup, functional tests, coverage, performance analysis, documentation generation, AI matrix generation, mutation testing, and final results indexing. Core correctness checks passed (52/52 test suites; 115/115 tests), performance tests passed (7/7), and generated-artifact validation passed. Final artifacts were regenerated at `docs/generated/RUN_MANIFEST.json` and `docs/generated/RESULTS_DASHBOARD.md`.

Mutation testing executed to completion and produced a report at `reports/mutation/mutation.html`, with an overall mutation score of 27.25% (informational quality signal, not a pipeline blocker).

Non-blocking notes observed during the run:

1. A Node deprecation warning related to shell argument escaping in a child-process path.
2. A Prisma upgrade availability notice.

Overall run health assessment: suitable for dissertation submission reproducibility claims within the stated scope and limitations.
