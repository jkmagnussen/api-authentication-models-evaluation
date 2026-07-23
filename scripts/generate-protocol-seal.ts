import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { GENERATED_FILES } from "./report-paths";

type ProtocolSeal = {
  generatedAt: string;
  lockedAt: string;
  protocolDocumentPath: string;
  protocolDocumentSha256: string;
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function main(): void {
  const root = process.cwd();
  const protocolPath = path.join(root, "docs", "evidence", "PRE_REGISTERED_ANALYSIS_PLAN.md");
  const outputPath = path.join(root, GENERATED_FILES.protocolSeal);
  const shouldRefresh = process.argv.includes("--refresh");

  if (!fs.existsSync(protocolPath)) {
    throw new Error("Missing pre-registered analysis plan: docs/evidence/PRE_REGISTERED_ANALYSIS_PLAN.md");
  }

  const protocolText = fs.readFileSync(protocolPath, "utf8");
  const protocolDocumentSha256 = sha256(protocolText);
  const now = new Date().toISOString();

  if (fs.existsSync(outputPath) && !shouldRefresh) {
    const existing = JSON.parse(fs.readFileSync(outputPath, "utf8")) as ProtocolSeal;
    if (existing.protocolDocumentSha256 === protocolDocumentSha256) {
      console.log(`Preserved protocol seal: ${outputPath}`);
      return;
    }
  }

  const payload: ProtocolSeal = {
    generatedAt: now,
    lockedAt: now,
    protocolDocumentPath: "docs/evidence/PRE_REGISTERED_ANALYSIS_PLAN.md",
    protocolDocumentSha256,
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log(`${shouldRefresh ? "Refreshed" : "Locked"} protocol seal: ${outputPath}`);
}

main();
