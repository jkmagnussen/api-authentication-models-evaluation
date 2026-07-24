import fs from 'fs';
import { variantTestMap } from '../misconfigurations/variant-test-map';
import { GENERATED_FILES } from './report-paths';

function titleCase(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function main() {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
  lines.push('# Variant Differential Report');
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push('Regenerate: npm run variants:report');
  lines.push('');
  lines.push(
    'This report maps each misconfiguration variant to the baseline security expectation and the focused exploit test that demonstrates the weakened behavior.'
  );
  lines.push('');
  lines.push(
    '| Variant | Category | Severity | Exploitability (0-10) | STRIDE | OWASP Category | Baseline Evidence | Focused Exploit Test | Expected Misconfigured Outcome | Focused Command |'
  );
  lines.push('|---|---|---|---:|---|---|---|---|---|---|');

  for (const [variantName, variantInfo] of Object.entries(variantTestMap)) {
    lines.push(
      `| ${titleCase(variantName)} | ${variantInfo.category.toUpperCase()} | ${variantInfo.severityClass} (${variantInfo.severityScore}) | ${variantInfo.exploitabilityScore10} | ${variantInfo.stride} | ${variantInfo.owaspCategory} | ${variantInfo.baselineEvidence.join('<br>')} | ${variantInfo.focusedTest} | ${variantInfo.regression} | ${variantInfo.command} |`
    );
  }

  lines.push('');
  lines.push('## Interpretation');
  lines.push('');
  lines.push(
    '- Baseline evidence files document the secure expectation in the normal implementation.'
  );
  lines.push(
    '- Focused exploit tests are intended to pass only when the corresponding misconfiguration is active.'
  );
  lines.push(
    '- A successful focused variant run is evidence that the misconfiguration changes behavior in a security-relevant way.'
  );

  const outputPath = GENERATED_FILES.variantDifferential;
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
  console.log(`Wrote ${outputPath}`);
}

main();
