import fs from 'fs';
import path from 'path';
import { GENERATED_FILES } from './report-paths';

function main(): void {
  const root = process.cwd();
  const interpretationPath = path.join(root, GENERATED_FILES.aiBlindInterpretation);

  if (!fs.existsSync(interpretationPath)) {
    throw new Error(
      `Missing blind interpretation artifact: ${GENERATED_FILES.aiBlindInterpretation}`
    );
  }

  const text = fs.readFileSync(interpretationPath, 'utf8');
  const hasAgreement = /^Reviewer Agreement:\s*AGREE\s*$/m.test(text);

  if (!hasAgreement) {
    console.log(
      '[objective:blind:disagreement] Current interpretation is not in AGREE mode; no simulation needed.'
    );
    return;
  }

  const simulated = text
    .replace(/^Reviewer Agreement:\s*AGREE\s*$/m, 'Reviewer Agreement: DISAGREE')
    .replace(/^Tie-break Reviewer:\s*.*$/m, 'Tie-break Reviewer: PENDING')
    .replace(/^Tie-break Decision:\s*.*$/m, 'Tie-break Decision: PENDING')
    .replace(/^Tie-break Signed At:\s*.*$/m, 'Tie-break Signed At: PENDING');

  const backupPath = `${interpretationPath}.bak`;
  fs.copyFileSync(interpretationPath, backupPath);
  fs.writeFileSync(interpretationPath, simulated);

  console.log(
    `[objective:blind:disagreement] Simulated disagreement by writing a backup to ${path.relative(root, backupPath)} and marking agreement DISAGREE.`
  );
  console.log(
    'Run npm run objective:preregistered:check to verify tie-break enforcement, then restore the backup manually if needed.'
  );
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[objective:blind:disagreement] ${message}`);
  process.exit(1);
}
