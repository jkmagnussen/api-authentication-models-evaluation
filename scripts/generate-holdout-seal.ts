import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { GENERATED_FILES } from "./report-paths";

type HoldoutSeal = {
  generatedAt: string;
  sealedAt: string;
  holdoutDefinitionPath: string;
  holdoutDefinitionSha256: string;
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function main(): void {
  const root = process.cwd();
  const outputPath = path.join(root, GENERATED_FILES.holdoutSeal);
  const holdoutDefinitionPath = path.join(root, GENERATED_FILES.analysisWindow);
  const shouldRefresh = process.argv.includes("--refresh");
  const now = new Date().toISOString();

  if (!fs.existsSync(holdoutDefinitionPath)) {
    throw new Error(`Missing holdout source artifact: ${GENERATED_FILES.analysisWindow}`);
  }

  const holdoutText = fs.readFileSync(holdoutDefinitionPath, "utf8");
  const holdoutHash = sha256(holdoutText);

  if (fs.existsSync(outputPath) && !shouldRefresh) {
    const existing = JSON.parse(fs.readFileSync(outputPath, "utf8")) as HoldoutSeal;
    const preserved: HoldoutSeal = {
      ...existing,
      generatedAt: now,
      holdoutDefinitionPath: GENERATED_FILES.analysisWindow,
      holdoutDefinitionSha256: holdoutHash,
    };
    fs.writeFileSync(outputPath, JSON.stringify(preserved, null, 2));
    console.log(`Preserved holdout seal: ${outputPath}`);
    return;
  }

  const payload: HoldoutSeal = {
    generatedAt: now,
    sealedAt: now,
    holdoutDefinitionPath: GENERATED_FILES.analysisWindow,
    holdoutDefinitionSha256: holdoutHash,
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log(`${shouldRefresh ? "Refreshed" : "Sealed"} holdout definition: ${outputPath}`);
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[objective:holdout:seal] ${message}`);
  process.exit(1);
}
