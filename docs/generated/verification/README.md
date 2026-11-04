# Test Verification Run

Date: 2026-10-13
Revision: `b7382e2a74964cecda2066991072a50b034df21f` (no differences from this revision in `src`, `tests`, `misconfigurations`, `prisma`, `scripts`, `package.json` or `jest.config.js`; checked with `git diff` and `git status`)
Runtime: Node.js `v24.19.0`

| Run | Command | Result | Log |
|---|---|---|---|
| Secure baseline | `npx jest --runInBand --ci` | 55/55 suites, 144/144 tests passed | [baseline-jest.log](./baseline-jest.log) |
| Weakened variants | `npm run test:variants` | 9/9 variant suites passed (each exploit-positive) | [variants-jest.log](./variants-jest.log) |

The baseline total includes 60 adversarial attack tests in `tests/attacks/`.
