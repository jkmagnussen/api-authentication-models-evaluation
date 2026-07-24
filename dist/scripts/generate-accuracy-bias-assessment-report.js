"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const report_paths_1 = require("./report-paths");
function readJson(relativePath) {
    const fullPath = path_1.default.join(process.cwd(), relativePath);
    return JSON.parse(fs_1.default.readFileSync(fullPath, 'utf8'));
}
function fmt(value, digits = 3) {
    return Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
}
function pct(value) {
    return `${fmt(value * 100, 1)}%`;
}
function main() {
    const advanced = readJson('docs/generated/ai-vs-human-advanced-comparisons.json');
    const agreement = readJson('ai-generated/results/checker-agreement-summary.json');
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
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.calibrationAgreementReportJson), JSON.stringify(output, null, 2));
    const lines = [];
    lines.push('# Calibration and Independent Agreement Report');
    lines.push('');
    lines.push(`Generated: ${output.generatedAt}`);
    lines.push('Regenerate: npm run objective:calibration:agreement');
    lines.push('');
    lines.push('This report combines a calibration-style accuracy signal with an independent checker-agreement control.');
    lines.push('');
    lines.push('## Calibration Signal');
    lines.push('');
    lines.push(`- Primary threshold: correctness failure count <= ${output.calibration.primaryThreshold}`);
    lines.push(`- False-confidence samples: ${output.calibration.falseConfidenceSamples}/${output.calibration.totalSamples} (${pct(output.calibration.rate)})`);
    lines.push('');
    lines.push('Sensitivity across thresholds:');
    lines.push('');
    lines.push('| Threshold | False-Confidence Samples | Total Samples | Rate |');
    lines.push('|---:|---:|---:|---:|');
    for (const row of output.calibration.sensitivity) {
        lines.push(`| ${row.threshold} | ${row.falseConfidenceSamples} | ${row.totalSamples} | ${pct(row.rate)} |`);
    }
    lines.push('');
    lines.push('## Independent Agreement Control');
    lines.push('');
    lines.push("| Scope | Observations | Cohen's kappa | Raw agreement | Disagreements |");
    lines.push('|---|---:|---:|---:|---:|');
    lines.push(`| Control set | ${output.agreement.controlAgreement.observations} | ${output.agreement.controlAgreement.kappa === null ? 'n/a' : fmt(output.agreement.controlAgreement.kappa, 3)} | ${output.agreement.controlAgreement.rawAgreementRate === null || output.agreement.controlAgreement.rawAgreementRate === undefined ? 'n/a' : pct(output.agreement.controlAgreement.rawAgreementRate)} | ${output.agreement.controlAgreement.disagreementCount ?? 'n/a'} |`);
    lines.push(`| Generated samples | ${output.agreement.generatedSampleAgreement.observations} | ${output.agreement.generatedSampleAgreement.kappa === null ? 'n/a' : fmt(output.agreement.generatedSampleAgreement.kappa, 3)} | ${output.agreement.generatedSampleAgreement.rawAgreementRate === null || output.agreement.generatedSampleAgreement.rawAgreementRate === undefined ? 'n/a' : pct(output.agreement.generatedSampleAgreement.rawAgreementRate)} | ${output.agreement.generatedSampleAgreement.disagreementCount ?? 'n/a'} |`);
    lines.push('');
    lines.push('### Generated-sample agreement by model');
    lines.push('');
    lines.push("| Model | Observations | Cohen's kappa | Raw agreement | Disagreements |");
    lines.push('|---|---:|---:|---:|---:|');
    for (const model of ['oauth', 'jwt', 'sessions']) {
        const row = output.agreement.generatedSampleAgreement.byModel?.[model];
        if (!row)
            continue;
        lines.push(`| ${model.toUpperCase()} | ${row.observations} | ${row.kappa === null ? 'n/a' : fmt(row.kappa, 3)} | ${row.rawAgreementRate === null || row.rawAgreementRate === undefined ? 'n/a' : pct(row.rawAgreementRate)} | ${row.disagreementCount ?? 'n/a'} |`);
    }
    lines.push('');
    lines.push('## Bias Framing');
    lines.push('');
    lines.push('- The calibration signal measures threshold sensitivity, not a universal accuracy score.');
    lines.push('- The agreement signal measures checker independence and reproducibility, not model capability.');
    lines.push('- Use both together: calibration for overconfidence, agreement for interpretive bias control.');
    lines.push('- Keep the result scope repository-specific and protocol-specific.');
    const mdPath = path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.calibrationAgreementReport);
    fs_1.default.writeFileSync(mdPath, `${lines.join('\n')}\n`);
    console.log(`Wrote ${report_paths_1.GENERATED_FILES.calibrationAgreementReport}`);
    console.log(`Wrote ${report_paths_1.GENERATED_FILES.calibrationAgreementReportJson}`);
}
main();
