import { spawnSync } from "child_process";
import { variantTestMap, VariantName } from "../misconfigurations/variant-test-map";

function main() {
  const variantName = process.argv[2] as VariantName | undefined;

  if (!variantName || !(variantName in variantTestMap)) {
    console.error("Usage: ts-node scripts/run-variant-focused-tests.ts <variant-name>");
    process.exit(1);
  }

  const focusedTest = variantTestMap[variantName].focusedTest;
  const result = spawnSync("npx", ["jest", "--runInBand", focusedTest], {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      APP_VARIANT: variantName,
    },
  });

  process.exit(result.status ?? 1);
}

main();
