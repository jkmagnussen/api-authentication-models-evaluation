import fs from "fs";
import { spawnSync } from "child_process";
import { variantTestMap, VariantName } from "../misconfigurations/variant-test-map";
import { GENERATED_FILES } from "./report-paths";

type VariantResult = {
  variantName: VariantName;
  category: string;
  focusedTest: string;
  regression: string;
  command: string;
  passed: boolean;
  durationMs: number;
};

function runFocusedVariantTest(variantName: VariantName): VariantResult {
  const variantInfo = variantTestMap[variantName];
  const startTime = Date.now();

  const result = spawnSync(
    "npx",
    ["jest", "--runInBand", variantInfo.focusedTest],
    {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        APP_VARIANT: variantName,
      },
    }
  );

  return {
    variantName,
    category: variantInfo.category,
    focusedTest: variantInfo.focusedTest,
    regression: variantInfo.regression,
    command: variantInfo.command,
    passed: (result.status ?? 1) === 0,
    durationMs: Date.now() - startTime,
  };
}

function writeSummary(results: VariantResult[]) {
  const markdownLines: string[] = [];
  markdownLines.push("# Variant Focused Test Summary");
  markdownLines.push("");
  markdownLines.push(`Generated: ${new Date().toISOString()}`);
  markdownLines.push("Regenerate: npm run test:variants:focused");
  markdownLines.push("");
  markdownLines.push("| Variant | Category | Focused Test | Expected Regression | Result | Duration (ms) | Command |");
  markdownLines.push("|---|---|---|---|---|---:|---|");

  for (const result of results) {
    markdownLines.push(
      `| ${result.variantName} | ${result.category.toUpperCase()} | ${result.focusedTest} | ${result.regression} | ${result.passed ? "PASS" : "FAIL"} | ${result.durationMs} | ${result.command} |`
    );
  }

  const outputPath = GENERATED_FILES.variantFocusedSummary;
  fs.writeFileSync(outputPath, `${markdownLines.join("\n")}\n`);

  const jsonOutputPath = GENERATED_FILES.variantFocusedJson;
  fs.writeFileSync(jsonOutputPath, JSON.stringify(results, null, 2));

  console.log(`Wrote ${outputPath}`);
  console.log(`Wrote ${jsonOutputPath}`);
}

function main() {
  const variantNames = Object.keys(variantTestMap) as VariantName[];
  const results = variantNames.map(runFocusedVariantTest);

  writeSummary(results);

  const failures = results.filter((result) => !result.passed);
  if (failures.length > 0) {
    process.exit(1);
  }
}

main();