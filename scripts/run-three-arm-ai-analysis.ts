import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";

type Provider = "local" | "azure" | "claude";

const PROVIDERS: Provider[] = ["local", "azure", "claude"];

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
  if (provider === "local") {
    return { ready: true };
  }

  if (provider === "azure") {
    if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
      return { ready: false, reason: "Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY." };
    }
    return { ready: true };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ready: false, reason: "Missing ANTHROPIC_API_KEY." };
  }

  return { ready: true };
}

function getGenerationCommand(provider: Provider): string {
  if (provider === "local") return "npm run ai:generate:all";
  if (provider === "azure") return "npm run ai:generate:azure";
  return "npm run ai:generate:claude";
}

function runArm(provider: Provider): boolean {
  console.log(`[three-arm] Starting ${provider.toUpperCase()} arm...`);

  const steps = [
    getGenerationCommand(provider),
    "npm run ai:test:oauth",
    "npm run ai:test:jwt",
    "npm run ai:test:sessions",
    "npm run ai:analyse",
    "npm run ai:report",
  ];

  for (const step of steps) {
    const ok = run(step);
    if (!ok) {
      console.error(`[three-arm] ${provider.toUpperCase()} step failed: ${step}`);
      return false;
    }
  }

  return true;
}

function snapshotArm(provider: Provider): void {
  const root = process.cwd();
  const armDir = path.join(root, "ai-generated", "arms", provider);
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

  fs.writeFileSync(
    path.join(armDir, "metadata.json"),
    JSON.stringify(
      {
        provider,
        sampleCount: process.env.AI_SAMPLE_COUNT ? Number(process.env.AI_SAMPLE_COUNT) : undefined,
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
}

function main(): void {
  const runSummary: Array<{ provider: Provider; status: "completed" | "skipped" | "failed"; reason?: string }> = [];

  for (const provider of PROVIDERS) {
    const readiness = providerReady(provider);
    if (!readiness.ready) {
      console.warn(`[three-arm] Skipping ${provider.toUpperCase()}: ${readiness.reason}`);
      runSummary.push({ provider, status: "skipped", reason: readiness.reason });
      continue;
    }

    const ok = runArm(provider);
    if (!ok) {
      runSummary.push({ provider, status: "failed", reason: "One or more pipeline steps failed." });
      continue;
    }

    snapshotArm(provider);
    runSummary.push({ provider, status: "completed" });
  }

  fs.writeFileSync(
    path.join(process.cwd(), "ai-generated", "arms", "run-summary.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sampleCount: Number(process.env.AI_SAMPLE_COUNT ?? "30"),
        providers: runSummary,
      },
      null,
      2
    )
  );

  const anyCompleted = runSummary.some((entry) => entry.status === "completed");
  if (!anyCompleted) {
    console.error("[three-arm] No provider arm completed. Configure provider credentials and try again.");
    process.exit(1);
  }

  console.log("[three-arm] Completed available provider arms and archived outputs.");
}

main();
