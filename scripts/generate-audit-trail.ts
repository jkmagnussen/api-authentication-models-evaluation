import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { GENERATED_FILES } from './report-paths';

type AuditTrailEntry = {
  label: string;
  path: string;
  sha256: string;
};

type AuditTrail = {
  generatedAt: string;
  signedAt: string;
  signatureSha256: string;
  entries: AuditTrailEntry[];
};

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

function readText(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing audit-trail input: ${path.relative(process.cwd(), filePath)}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function main(): void {
  const root = process.cwd();
  const outputPath = path.join(root, GENERATED_FILES.auditTrail);
  const shouldRefresh = process.argv.includes('--refresh');
  const now = new Date().toISOString();

  const entries: AuditTrailEntry[] = [
    {
      label: 'protocol-seal',
      path: GENERATED_FILES.protocolSeal,
      sha256: sha256(readText(path.join(root, GENERATED_FILES.protocolSeal))),
    },
    {
      label: 'power-analysis-seal',
      path: GENERATED_FILES.powerAnalysisSeal,
      sha256: sha256(readText(path.join(root, GENERATED_FILES.powerAnalysisSeal))),
    },
    {
      label: 'blind-interpretation',
      path: GENERATED_FILES.aiBlindInterpretation,
      sha256: sha256(readText(path.join(root, GENERATED_FILES.aiBlindInterpretation))),
    },
    {
      label: 'analysis-window',
      path: GENERATED_FILES.analysisWindow,
      sha256: sha256(readText(path.join(root, GENERATED_FILES.analysisWindow))),
    },
    {
      label: 'holdout-seal',
      path: GENERATED_FILES.holdoutSeal,
      sha256: sha256(readText(path.join(root, GENERATED_FILES.holdoutSeal))),
    },
    {
      label: 'preregistered-compliance',
      path: GENERATED_FILES.preregCompliance,
      sha256: sha256(readText(path.join(root, GENERATED_FILES.preregCompliance))),
    },
  ];

  const signatureSource = entries
    .map((entry) => `${entry.label}:${entry.path}:${entry.sha256}`)
    .join('\n');
  const payload: AuditTrail = {
    generatedAt: now,
    signedAt: now,
    signatureSha256: sha256(signatureSource),
    entries,
  };

  if (fs.existsSync(outputPath) && !shouldRefresh) {
    const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8')) as AuditTrail;
    if (existing.signatureSha256 === payload.signatureSha256) {
      fs.writeFileSync(outputPath, JSON.stringify({ ...existing, generatedAt: now }, null, 2));
      console.log(`Preserved audit trail: ${outputPath}`);
      return;
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log(`${shouldRefresh ? 'Refreshed' : 'Signed'} audit trail: ${outputPath}`);
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[objective:audit:trail] ${message}`);
  process.exit(1);
}
