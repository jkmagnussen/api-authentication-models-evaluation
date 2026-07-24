import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";

dotenv.config({ override: true });

type Provider = "openai" | "claude";
type PromptMode = "neutral" | "security-guided";

type Arm = {
  key: string;
  provider: Provider;
  promptMode: PromptMode;
};

type ArmSnapshotMetadata = {
  provider: Provider;
  promptMode: PromptMode;
  sampleCount?: number;
  generatedAt: string;
  providerModelIdentifier?: string;
  providerEndpoint?: string;
  generationParameters?: {
    temperature?: number;
    maxTokens?: number;
  };
  promptFingerprints?: {
    promptMode?: string;
    systemPromptSha256?: string;
    modelPromptFingerprints?: Record<string, { promptSha256: string; systemPromptSha256: string; combinedPromptSha256: string }>;
  };
  retryPolicy?: {
    maxProviderAttempts?: number;
    baseRetryDelayMs?: number;
    maxRetryJitterMs?: number;
    retryableStatusCodes?: number[];
  };
  retrySummary?: {
    totalAttempts?: number;
    successfulRequests?: number;
    retries?: number;
    retryableHttpFailures?: number;
    networkFailures?: number;
  };
  overallFailure?: {
    failedSamples: number;
    totalSamples: number;
    failureRatePct: number;
  };
};

function getArgValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const ARMS: Arm[] = [
  { key: "openai-neutral", provider: "openai", promptMode: "neutral" },
  { key: "openai-security-guided", provider: "openai", promptMode: "security-guided" },
  { key: "claude-neutral", provider: "claude", promptMode: "neutral" },
  { key: "claude-security-guided", provider: "claude", promptMode: "security-guided" },
];

function parseTargetArmKey(): string | null {
  const fromFlag = getArgValue("--arm");
  const fromEnv = process.env.AI_ARM?.trim() ?? "";
  const value = (fromFlag ?? fromEnv).trim();
  return value.length > 0 ? value : null;
}

function parseAllowPartial(): boolean {
  const fromFlag = getArgValue("--allow-partial");
  if (fromFlag) {
    return ["1", "true", "yes"].includes(fromFlag.toLowerCase());
  }

  const fromEnv = (process.env.AI_ALLOW_PARTIAL_MATRIX ?? "").trim().toLowerCase();
  return ["1", "true", "yes"].includes(fromEnv);
}

function run(command: string, envOverrides: Record<string, string> = {}): boolean {
  const result = spawnSync(command, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      ...envOverrides,
    },
  });

  return (result.status ?? 1) === 0;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function loadOverallFailure(root: string): ArmSnapshotMetadata["overallFailure"] | null {
  const csvPath = path.join(root, "ai-generated", "results", "ai-samples-failure-rates.csv");
  if (!fs.existsSync(csvPath)) return null;

  const lines = fs
    .readFileSync(csvPath, "utf8")
    .trim()
    .split(/\r?\n/)
    .map(parseCsvLine);

  if (lines.length <= 1) return null;
  const overall = lines.slice(1).find((row) => row[0]?.toUpperCase() === "OVERALL");
  if (!overall) return null;

  return {
    totalSamples: Number(overall[1]),
    failedSamples: Number(overall[3]),
    failureRatePct: Number(overall[4]),
  };
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyDirectory(sourceDir: string, targetDir: string): void {
  ensureDir(targetDir);
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function clearDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      fs.rmSync(target, { recursive: true, force: true });
    } else {
      fs.unlinkSync(target);
    }
  }
}

function providerReady(provider: Provider): { ready: boolean; reason?: string } {
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      return { ready: false, reason: "Missing OPENAI_API_KEY." };
    }
    return { ready: true };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ready: false, reason: "Missing ANTHROPIC_API_KEY." };
  }

  return { ready: true };
}

function getGenerationCommand(arm: Arm): string {
  if (arm.provider === "openai") {
    return `npm run ai:generate:openai -- --prompt-mode ${arm.promptMode}`;
  }

  return `npm run ai:generate:claude -- --prompt-mode ${arm.promptMode}`;
}

function runArm(arm: Arm): boolean {
  console.log(`[ai-matrix] Starting ${arm.key.toUpperCase()} arm...`);

  const steps = [
    getGenerationCommand(arm),
    "npm run ai:test:oauth",
    "npm run ai:test:jwt",
    "npm run ai:test:sessions",
    "npm run ai:analyse",
    "npm run ai:report",
  ];

  for (const step of steps) {
    const ok = run(step);
    if (!ok) {
      console.error(`[ai-matrix] ${arm.key.toUpperCase()} step failed: ${step}`);
      return false;
    }
  }

  return true;
}

function snapshotArm(arm: Arm): ArmSnapshotMetadata {
  const root = process.cwd();
  const armDir = path.join(root, "ai-generated", "arms", arm.key);
  const sampleTarget = path.join(armDir, "samples");
  const resultsTarget = path.join(armDir, "results");

  ensureDir(armDir);
  clearDirectory(sampleTarget);
  clearDirectory(resultsTarget);

  ensureDir(sampleTarget);
  ensureDir(resultsTarget);

  for (const model of ["oauth", "jwt", "sessions"]) {
    copyDirectory(path.join(root, "ai-generated", model), path.join(sampleTarget, model));
  }

  copyDirectory(path.join(root, "ai-generated", "results"), resultsTarget);

  const generationMetadataPath = path.join(root, "ai-generated", "results", "generation-metadata.json");
  const generationMetadata = fs.existsSync(generationMetadataPath)
    ? (JSON.parse(fs.readFileSync(generationMetadataPath, "utf8")) as ArmSnapshotMetadata)
    : null;

  const overallFailure = loadOverallFailure(root);

  const metadata: ArmSnapshotMetadata = {
    provider: arm.provider,
    promptMode: arm.promptMode,
    sampleCount: process.env.AI_SAMPLE_COUNT ? Number(process.env.AI_SAMPLE_COUNT) : undefined,
    generatedAt: new Date().toISOString(),
    providerModelIdentifier: generationMetadata?.providerModelIdentifier,
    providerEndpoint: generationMetadata?.providerEndpoint,
    generationParameters: generationMetadata?.generationParameters,
    promptFingerprints: generationMetadata?.promptFingerprints,
    retryPolicy: generationMetadata?.retryPolicy,
    retrySummary: generationMetadata?.retrySummary,
    overallFailure: overallFailure ?? undefined,
  };

  fs.writeFileSync(
    path.join(armDir, "metadata.json"),
    JSON.stringify(metadata, null, 2)
  );

  return metadata;
}

function main(): void {
  const runSummary: Array<
    Arm & {
      status: "completed" | "skipped" | "failed";
      reason?: string;
      providerModelIdentifier?: string;
      promptFingerprint?: string;
      overallFailureRatePct?: number;
      overallFailedSamples?: number;
      overallTotalSamples?: number;
    }
  > = [];
  const targetArmKey = parseTargetArmKey();
  const allowPartial = parseAllowPartial();
  const armsToRun = targetArmKey ? ARMS.filter((arm) => arm.key === targetArmKey) : ARMS;

  if (targetArmKey && armsToRun.length === 0) {
    console.error(`[ai-matrix] Unknown arm: ${targetArmKey}. Use one of: ${ARMS.map((arm) => arm.key).join(", ")}`);
    process.exit(1);
  }

  for (const arm of armsToRun) {
    const readiness = providerReady(arm.provider);
    if (!readiness.ready) {
      const reason = readiness.reason ?? "Provider credentials unavailable.";
      if (allowPartial) {
        console.warn(`[ai-matrix] Skipping ${arm.key.toUpperCase()}: ${reason}`);
        runSummary.push({ ...arm, status: "skipped", reason });
      } else {
        console.error(`[ai-matrix] ${arm.key.toUpperCase()} is required but unavailable: ${reason}`);
        runSummary.push({ ...arm, status: "failed", reason });
      }
      continue;
    }

    const ok = runArm(arm);
    if (!ok) {
      runSummary.push({ ...arm, status: "failed", reason: "One or more pipeline steps failed." });
      continue;
    }

    const snapshotMetadata = snapshotArm(arm);
    runSummary.push({
      ...arm,
      status: "completed",
      providerModelIdentifier: snapshotMetadata.providerModelIdentifier,
      promptFingerprint: snapshotMetadata.promptFingerprints?.systemPromptSha256,
      overallFailureRatePct: snapshotMetadata.overallFailure?.failureRatePct,
      overallFailedSamples: snapshotMetadata.overallFailure?.failedSamples,
      overallTotalSamples: snapshotMetadata.overallFailure?.totalSamples,
    });
  }

  const summaryPayload = {
    generatedAt: new Date().toISOString(),
    sampleCount: Number(process.env.AI_SAMPLE_COUNT ?? "30"),
    allowPartial,
    requiredArms: armsToRun.map((arm) => arm.key),
    providers: runSummary,
  };

  fs.writeFileSync(
    path.join(process.cwd(), "ai-generated", "arms", "run-summary.json"),
    JSON.stringify(summaryPayload, null, 2)
  );

  const historyDir = path.join(process.cwd(), "ai-generated", "arms", "history");
  ensureDir(historyDir);
  const historyFileName = `${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(path.join(historyDir, historyFileName), JSON.stringify(summaryPayload, null, 2));

  const completedCount = runSummary.filter((entry) => entry.status === "completed").length;
  const requiredCount = armsToRun.length;

  if (allowPartial) {
    if (completedCount === 0) {
      console.error("[ai-matrix] No AI provider arm completed. Configure provider credentials and try again.");
      process.exit(1);
    }

    console.log("[ai-matrix] Completed available provider-condition arms and archived outputs.");
    return;
  }

  if (completedCount !== requiredCount) {
    console.error(
      `[ai-matrix] Incomplete provider matrix coverage (${completedCount}/${requiredCount}). Re-run after configuring all required providers or pass --allow-partial true.`
    );
    process.exit(1);
  }

  console.log("[ai-matrix] Completed full provider-condition matrix and archived outputs.");
}

main();