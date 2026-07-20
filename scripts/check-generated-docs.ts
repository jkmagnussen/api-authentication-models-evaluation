import fs from "fs";
import { EXPECTED_GENERATED_DOC_FILES } from "./report-paths";

function main() {
  const missing = EXPECTED_GENERATED_DOC_FILES.filter((file) => !fs.existsSync(file));

  if (missing.length > 0) {
    console.error("Missing generated artifacts:");
    for (const file of missing) {
      console.error(`- ${file}`);
    }
    console.error("Run: npm run docs:generate");
    process.exit(1);
  }

  console.log("All expected generated artifacts are present.");
}

main();
