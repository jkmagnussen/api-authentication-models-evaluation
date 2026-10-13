import * as fs from 'fs';
import * as path from 'path';
import ts from 'typescript';

const ROOT = path.resolve(__dirname, '..');
const STUDY_ID = 'ai-clean-2026-10-05';
const STUDY = path.join(ROOT, 'ai-generated/cohorts', STUDY_ID);
const OUT = path.join(ROOT, 'docs/generated/AI_CLEAN_SYNTAX_QUADRANTS.md');
const ARMS = ['claude-neutral', 'claude-security-guided', 'openai-neutral', 'openai-security-guided'];
const MECHS = ['oauth', 'jwt', 'sessions'];

type Cell = { n: number; clean: number; flagged: number; cleanFlagged: number; cleanUnflagged: number; failFlagged: number; failUnflagged: number };
const cells = new Map<string, Cell>();
const key = (arm: string, mech: string) => `${arm}|${mech}`;

for (const cohort of fs.readdirSync(STUDY).filter((d) => d.startsWith('cohort-')).sort()) {
  for (const arm of ARMS) {
    for (const mech of MECHS) {
      const file = path.join(STUDY, cohort, 'arms', arm, mech, 'sample1.ts');
      const source = fs.readFileSync(file, 'utf8');
      const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true) as ts.SourceFile & {
        parseDiagnostics: unknown[];
      };
      const parseFail = sf.parseDiagnostics.length > 0;
      const tests = JSON.parse(
        fs.readFileSync(path.join(STUDY, cohort, 'arms', arm, 'results', `${mech}-sample1-tests.json`), 'utf8'),
      );
      const flagged = !tests.passed;
      const c = cells.get(key(arm, mech)) ?? { n: 0, clean: 0, flagged: 0, cleanFlagged: 0, cleanUnflagged: 0, failFlagged: 0, failUnflagged: 0 };
      c.n++;
      if (flagged) c.flagged++;
      if (!parseFail) c.clean++;
      if (!parseFail && flagged) c.cleanFlagged++;
      if (!parseFail && !flagged) c.cleanUnflagged++;
      if (parseFail && flagged) c.failFlagged++;
      if (parseFail && !flagged) c.failUnflagged++;
      cells.set(key(arm, mech), c);
    }
  }
}

const sum = (f: (c: Cell) => number, filter: (k: string) => boolean = () => true) =>
  [...cells.entries()].filter(([k]) => filter(k)).reduce((s, [, c]) => s + f(c), 0);

const lines: string[] = [
  '# Clean-Corpus Syntax and Heuristic Quadrants',
  '',
  `Study ID: \`${STUDY_ID}\`. Regenerate: \`npx ts-node scripts/analyze-clean-syntax-quadrants.ts\`.`,
  '',
  'Parse failure = `ts.createSourceFile` reports one or more parse diagnostics (structural parse only, not a TypeScript compile). Flagged = the local heuristic checks did not pass.',
  '',
  '## Per arm and mechanism',
  '',
  '| Arm | Mechanism | Outputs | Parse-clean | Heuristic-flagged |',
  '|---|---|---:|---:|---:|',
];
for (const arm of ARMS) {
  for (const mech of MECHS) {
    const c = cells.get(key(arm, mech))!;
    lines.push(`| ${arm} | ${mech} | ${c.n} | ${c.clean} | ${c.flagged} |`);
  }
}

lines.push('', '## Per arm', '', '| Arm | Outputs | Parse-clean | Parse-failed | Flagged | Clean & unflagged | Clean & flagged | Failed & flagged | Failed & unflagged |', '|---|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const arm of ARMS) {
  const f = (g: (c: Cell) => number) => sum(g, (k) => k.startsWith(`${arm}|`));
  lines.push(`| ${arm} | ${f((c) => c.n)} | ${f((c) => c.clean)} | ${f((c) => c.n - c.clean)} | ${f((c) => c.flagged)} | ${f((c) => c.cleanUnflagged)} | ${f((c) => c.cleanFlagged)} | ${f((c) => c.failFlagged)} | ${f((c) => c.failUnflagged)} |`);
}

const total = sum((c) => c.n);
const clean = sum((c) => c.clean);
lines.push(
  '',
  '## Totals',
  '',
  `- Outputs: ${total}`,
  `- Parse-clean: ${clean}; parse-failed: ${total - clean} (${(((total - clean) / total) * 100).toFixed(1)}%)`,
  `- Heuristic-flagged: ${sum((c) => c.flagged)}`,
  `- Clean & unflagged: ${sum((c) => c.cleanUnflagged)}; clean & flagged: ${sum((c) => c.cleanFlagged)}`,
  `- Failed & flagged: ${sum((c) => c.failFlagged)}; failed & unflagged: ${sum((c) => c.failUnflagged)}`,
  '',
);

fs.writeFileSync(OUT, lines.join('\n'));
console.log(`Wrote ${path.relative(ROOT, OUT)}`);
