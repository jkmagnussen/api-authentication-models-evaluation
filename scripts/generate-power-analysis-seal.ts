import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { GENERATED_FILES } from "./report-paths";

type PowerAnalysisSeal = {
  generatedAt: string;
  sealedAt: string;
  rationalePath: string;
  rationaleSha256: string;
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function main(): void {
  const root = process.cwd();
  const rationalePath = path.join(root, GENERATED_FILES.sensitivityAnalysis);
  const outputPath = path.join(root, GENERATED_FILES.powerAnalysisSeal);
  const shouldRefresh = process.argv.includes("--refresh");
  const now = new Date().toISOString();

  if (!fs.existsSync(rationalePath)) {
    throw new Error(`Missing sensitivity analysis source: ${GENERATED_FILES.sensitivityAnalysis}`);
  }

  const rationaleText = fs.readFileSync(rationalePath, "utf8");
  const rationaleSha256 = sha256(rationaleText);

  if (fs.existsSync(outputPath) && !shouldRefresh) {
    const existing = JSON.parse(fs.readFileSync(outputPath, "utf8")) as PowerAnalysisSeal;
    const preserved: PowerAnalysisSeal = {
      ...existing,
      generatedAt: now,
      rationalePath: GENERATED_FILES.sensitivityAnalysis,
      rationaleSha256,
    };
    fs.writeFileSync(outputPath, JSON.stringify(preserved, null, 2));
    console.log(`Preserved power analysis seal: ${outputPath}`);
    return;
  }

  const payload: PowerAnalysisSeal = {
    generatedAt: now,
    sealedAt: now,
    rationalePath: GENERATED_FILES.sensitivityAnalysis,
    rationaleSha256,
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log(`${shouldRefresh ? "Refreshed" : "Sealed"} power analysis rationale: ${outputPath}`);
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[objective:power:seal] ${message}`);
  process.exit(1);
}