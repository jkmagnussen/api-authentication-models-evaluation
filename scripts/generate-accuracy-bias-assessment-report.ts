import fs from 'fs';
import path from 'path';
import { GENERATED_FILES } from './report-paths';

type FalseConfidenceRow = {
  threshold: number;
  falseConfidenceSamples: number;
  totalSamples: number;
  rate: number;
};

type AgreementRow = {
  observations: number;
  kappa: number | null;
  rawAgreementRate?: number | null;
  disagreementCount?: number;
};

type AgreementSummary = {
  controlAgreement?: AgreementRow;
  generatedSampleAgreement?: AgreementRow & {
    byModel?: Record<string, AgreementRow>;
  };
};

type AdvancedSummary = {
  falseConfidenceRate: {
    lowCorrectnessThreshold: number;
    falseConfidenceSamples: number;
    totalSamples: number;
    rate: number;
  };
  falseConfidenceSensitivity: FalseConfidenceRow[];
};

function readJson<T>(relativePath: string): T {
  const fullPath = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

function fmt(value: number, digits = 3): string {
  return Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
}

function pct(value: number): string {
  return `${fmt(value * 100, 1)}%`;
}

function main() {
  const advanced = readJson<AdvancedSummary>(
    'docs/generated/ai-vs-human-advanced-comparisons.json'
  );
  const agreement = readJson<AgreementSummary>(
    'ai-generated/results/checker-agreement-summary.json'
  );

  if (!agreement.controlAgreement || !agreement.generatedSampleAgreement) {
    throw new Error('checker-agreement-summary.json is missing required agreement sections');
  }

  const output = {
    generatedAt: new Date().toISOString(),
    calibration: {
      primaryThreshold: advanced.falseConfidenceRate.lowCorrectnessThreshold,
      falseConfidenceSamples: advanced.falseConfidenceRate.falseConfidenceSamples,
      totalSamples: advanced.falseConfidenceRate.totalSamples,
      rate: advanced.falseConfidenceRate.rate,
      sensitivity: advanced.falseConfidenceSensitivity,
    },
    agreement: {
      controlAgreement: agreement.controlAgreement,
      generatedSampleAgreement: agreement.generatedSampleAgreement,
    },
  };

  fs.writeFileSync(
    path.join(process.cwd(), GENERATED_FILES.calibrationAgreementReportJson),
    JSON.stringify(output, null, 2)
  );

  const lines: string[] = [];
  lines.push('# Calibration and Independent Agreement Report');
  lines.push('');
  lines.push(`Generated: ${output.generatedAt}`);
  lines.push('Regenerate: npm run objective:calibration:agreement');
  lines.push('');
  lines.push(
    'This report combines a calibration-style accuracy signal with an independent checker-agreement control.'
  );
  lines.push('');

  lines.push('## Calibration Signal');
  lines.push('');
  lines.push(
    `- Primary threshold: correctness failure count <= ${output.calibration.primaryThreshold}`
  );
  lines.push(
    `- False-confidence samples: ${output.calibration.falseConfidenceSamples}/${output.calibration.totalSamples} (${pct(output.calibration.rate)})`
  );
  lines.push('');
  lines.push('Sensitivity across thresholds:');
  lines.push('');
  lines.push('| Threshold | False-Confidence Samples | Total Samples | Rate |');
  lines.push('|---:|---:|---:|---:|');
  for (const row of output.calibration.sensitivity) {
    lines.push(
      `| ${row.threshold} | ${row.falseConfidenceSamples} | ${row.totalSamples} | ${pct(row.rate)} |`
    );
  }
  lines.push('');

  lines.push('## Independent Agreement Control');
  lines.push('');
  lines.push("| Scope | Observations | Cohen's kappa | Raw agreement | Disagreements |");
  lines.push('|---|---:|---:|---:|---:|');
  lines.push(
    `| Control set | ${output.agreement.controlAgreement.observations} | ${output.agreement.controlAgreement.kappa === null ? 'n/a' : fmt(output.agreement.controlAgreement.kappa, 3)} | ${output.agreement.controlAgreement.rawAgreementRate === null || output.agreement.controlAgreement.rawAgreementRate === undefined ? 'n/a' : pct(output.agreement.controlAgreement.rawAgreementRate)} | ${output.agreement.controlAgreement.disagreementCount ?? 'n/a'} |`
  );
  lines.push(
    `| Generated samples | ${output.agreement.generatedSampleAgreement.observations} | ${output.agreement.generatedSampleAgreement.kappa === null ? 'n/a' : fmt(output.agreement.generatedSampleAgreement.kappa, 3)} | ${output.agreement.generatedSampleAgreement.rawAgreementRate === null || output.agreement.generatedSampleAgreement.rawAgreementRate === undefined ? 'n/a' : pct(output.agreement.generatedSampleAgreement.rawAgreementRate)} | ${output.agreement.generatedSampleAgreement.disagreementCount ?? 'n/a'} |`
  );
  lines.push('');

  lines.push('### Generated-sample agreement by model');
  lines.push('');
  lines.push("| Model | Observations | Cohen's kappa | Raw agreement | Disagreements |");
  lines.push('|---|---:|---:|---:|---:|');
  for (const model of ['oauth', 'jwt', 'sessions']) {
    const row = output.agreement.generatedSampleAgreement.byModel?.[model];
    if (!row) continue;
    lines.push(
      `| ${model.toUpperCase()} | ${row.observations} | ${row.kappa === null ? 'n/a' : fmt(row.kappa, 3)} | ${row.rawAgreementRate === null || row.rawAgreementRate === undefined ? 'n/a' : pct(row.rawAgreementRate)} | ${row.disagreementCount ?? 'n/a'} |`
    );
  }
  lines.push('');

  lines.push('## Bias Framing');
  lines.push('');
  lines.push(
    '- The calibration signal measures threshold sensitivity, not a universal accuracy score.'
  );
  lines.push(
    '- The agreement signal measures checker independence and reproducibility, not model capability.'
  );
  lines.push(
    '- Use both together: calibration for overconfidence, agreement for interpretive bias control.'
  );
  lines.push('- Keep the result scope repository-specific and protocol-specific.');

  const mdPath = path.join(process.cwd(), GENERATED_FILES.calibrationAgreementReport);
  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);

  console.log(`Wrote ${GENERATED_FILES.calibrationAgreementReport}`);
  console.log(`Wrote ${GENERATED_FILES.calibrationAgreementReportJson}`);
}

main();
