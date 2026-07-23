# Holdout Set Definition

## Purpose

This holdout set is reserved for final confirmatory interpretation and should not be altered without explicit protocol deviation documentation.

## Candidate Holdout Items

1. One OAuth-focused AI sample cohort slice not used for intermediate interpretation.
2. One JWT-focused AI sample cohort slice not used for intermediate interpretation.
3. One Sessions-focused AI sample cohort slice not used for intermediate interpretation.

## Governance

1. Changes to this file require resealing via `npm run objective:holdout:refresh`.
2. Any holdout definition changes after confirmatory drafting must be listed in `docs/generated/PROTOCOL_DEVIATIONS.md`.
