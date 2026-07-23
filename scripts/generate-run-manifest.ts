import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "node:child_process";
import { createHash } from "crypto";
import { GENERATED_FILES } from "./report-paths";
import { GeneratorModel, PromptMode, getGeneratorPrompt, getSystemPrompt } from "../ai-generated/generator-prompts";

type ArmRunSummaryEntry = {
  key: string;
  status: "completed" | "skipped" | "failed";
  reason?: string;
};

type ArmRunSummary = {
  generatedAt?: string;
  allowPartial?: boolean;
  requiredArms?: string[];
  providers?: ArmRunSummaryEntry[];
};

type ArmMetadata = {
  provider?: string;
  promptMode?: string;
  providerModelIdentifier?: string;
  providerEndpoint?: string;
  promptFingerprints?: {
    systemPromptSha256?: string;
    modelPromptFingerprints?: Record<string, { combinedPromptSha256?: string }>;
  };
  generationParameters?: {
    temperature?: number;
    maxTokens?: number;
  };
  retryPolicy?: {
    maxProviderAttempts?: number;
    retryableStatusCodes?: number[];
  };
  retrySummary?: {
    totalAttempts?: number;
    retries?: number;
    retryableHttpFailures?: number;
    networkFailures?: number;
  };
};

type LegacyGenerationMetadata = {
  providerModel?: string;
  providerModelIdentifier?: string;
  promptMode?: PromptMode;
  generationParameters?: {
    temperature?: number;
    maxTokens?: number;
  };
  maxTokens?: number;
  temperature?: number;
};

type GovernanceMode = "confirmatory" | "exploratory";

function readFileSha256IfExists(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return sha256(fs.readFileSync(filePath, "utf8"));
}

function runCommand(command: string, args: string[] = []): string | null {
  const result = spawnSync(command, args, { encoding: "utf8", shell: false });
  if ((result.status ?? 1) !== 0) return null;
  return result.stdout.trim();
}

function runAny(commands: Array<{ command: string; args?: string[] }>): string | null {
  for (const candidate of commands) {
    const value = runCommand(candidate.command, candidate.args ?? []);
    if (value) return value;
  }
  return null;
}

function parseDatabaseProvider(databaseUrl: string | undefined): string {
  if (!databaseUrl) return "unknown";
  const lower = databaseUrl.toLowerCase();
  if (lower.startsWith("postgres://") || lower.startsWith("postgresql://")) return "postgresql";
  if (lower.startsWith("mysql://")) return "mysql";
  if (lower.startsWith("sqlite://") || lower.startsWith("file:")) return "sqlite";
  if (lower.startsWith("sqlserver://")) return "sqlserver";
  if (lower.startsWith("mongodb://") || lower.startsWith("mongodb+srv://")) return "mongodb";
  return "unknown";
}

function parseNpmVersionFromUserAgent(userAgent: string | undefined): string | null {
  if (!userAgent) return null;
  const match = userAgent.match(/\bnpm\/(\d+\.\d+\.\d+)\b/i);
  return match?.[1] ?? null;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function derivePromptFingerprint(promptMode: PromptMode | null): {
  systemPromptSha256: string;
  combinedPromptFingerprints: Array<{ model: string; combinedPromptSha256: string }>;
} | null {
  if (!promptMode) return null;

  const models: GeneratorModel[] = ["oauth", "jwt", "sessions"];
  const systemPrompt = getSystemPrompt(promptMode);

  return {
    systemPromptSha256: sha256(systemPrompt),
    combinedPromptFingerprints: models.map((model) => ({
      model,
      combinedPromptSha256: sha256(`${systemPrompt}\n${getGeneratorPrompt(model, promptMode)}`),
    })),
  };
}

function readJsonIfExists<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function readBlindInterpretationGovernance(root: string): {
  mode: GovernanceMode;
  claimClass: "governed-confirmatory" | "exploratory-author-interpreted";
  blindInterpretationStatus: "finalized-pre-unblind" | "draft-needs-finalization" | "unknown";
  reviewerFinalizationComplete: boolean;
} {
  const blindInterpretationPath = path.join(root, GENERATED_FILES.aiBlindInterpretation);
  if (!fs.existsSync(blindInterpretationPath)) {
    return {
      mode: "exploratory",
      claimClass: "exploratory-author-interpreted",
      blindInterpretationStatus: "unknown",
      reviewerFinalizationComplete: false,
    };
  }

  const text = fs.readFileSync(blindInterpretationPath, "utf8");
  const reviewerA = text.match(/^Reviewer A:\s*(.*)$/m)?.[1]?.trim() ?? "";
  const reviewerASignedAt = text.match(/^Reviewer A Signed At:\s*(.*)$/m)?.[1]?.trim() ?? "";
  const reviewerAIndependence = text.match(/^Reviewer A Independence:\s*(.*)$/m)?.[1]?.trim() ?? "";
  const reviewerACoi = text.match(/^Reviewer A COI Disclosure:\s*(.*)$/m)?.[1]?.trim() ?? "";
  const reviewerB = text.match(/^Reviewer B:\s*(.*)$/m)?.[1]?.trim() ?? "";
  const reviewerBSignedAt = text.match(/^Reviewer B Signed At:\s*(.*)$/m)?.[1]?.trim() ?? "";
  const reviewerBIndependence = text.match(/^Reviewer B Independence:\s*(.*)$/m)?.[1]?.trim() ?? "";
  const reviewerBCoi = text.match(/^Reviewer B COI Disclosure:\s*(.*)$/m)?.[1]?.trim() ?? "";
  const reviewerAgreement = text.match(/^Reviewer Agreement:\s*(.*)$/m)?.[1]?.trim() ?? "";

  const finalized = /^Status:\s*FINALIZED_PRE_UNBLIND\s*$/m.test(text) && !/^Status:\s*DRAFT_NEEDS_FINALIZATION\s*$/m.test(text);
  const reviewerFinalizationComplete =
    finalized &&
    reviewerA.length > 0 && reviewerA !== "PENDING" &&
    reviewerASignedAt.length > 0 && reviewerASignedAt !== "PENDING" &&
    reviewerAIndependence === "INDEPENDENT" &&
    reviewerACoi === "NONE" &&
    reviewerB.length > 0 && reviewerB !== "PENDING" &&
    reviewerBSignedAt.length > 0 && reviewerBSignedAt !== "PENDING" &&
    reviewerBIndependence === "INDEPENDENT" &&
    reviewerBCoi === "NONE" &&
    reviewerA !== reviewerB &&
    (reviewerAgreement === "AGREE" || reviewerAgreement === "DISAGREE");

  return {
    mode: reviewerFinalizationComplete ? "confirmatory" : "exploratory",
    claimClass: reviewerFinalizationComplete ? "governed-confirmatory" : "exploratory-author-interpreted",
    blindInterpretationStatus: finalized ? "finalized-pre-unblind" : /^Status:\s*DRAFT_NEEDS_FINALIZATION\s*$/m.test(text) ? "draft-needs-finalization" : "unknown",
    reviewerFinalizationComplete,
  };
}

function main(): void {
  const root = process.cwd();
  const packageJsonPath = path.join(root, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const nodeVersion = process.version;
  const npmVersion =
    runAny([
    { command: "npm", args: ["--version"] },
    { command: "npm.cmd", args: ["--version"] },
    ]) ?? parseNpmVersionFromUserAgent(process.env.npm_config_user_agent);
  const gitCommit = runCommand("git", ["rev-parse", "HEAD"]);
  const gitBranch = runCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  const prismaVersion = runAny([
    { command: "npx", args: ["prisma", "--version"] },
    { command: "npx.cmd", args: ["prisma", "--version"] },
  ]);
  const platformRelease = os.release();

  const generationMetadataPath = path.join(root, "ai-generated", "results", "generation-metadata.json");
  const generationMetadata = readJsonIfExists<Record<string, unknown>>(generationMetadataPath);
  const packageLockPath = path.join(root, "package-lock.json");
  const packageLockSha256 = readFileSha256IfExists(packageLockPath);

  const runSummaryPath = path.join(root, "ai-generated", "arms", "run-summary.json");
  const runSummary = readJsonIfExists<ArmRunSummary>(runSummaryPath);
  const governance = readBlindInterpretationGovernance(root);

  const armMetadataEntries = (runSummary?.providers ?? []).map((provider) => {
    const metadataPath = path.join(root, "ai-generated", "arms", provider.key, "metadata.json");
    const metadata = readJsonIfExists<ArmMetadata>(metadataPath);
    const legacyMetadataPath = path.join(
      root,
      "ai-generated",
      "arms",
      provider.key,
      "results",
      "generation-metadata.json"
    );
    const legacyMetadata = readJsonIfExists<LegacyGenerationMetadata>(legacyMetadataPath);

    const promptMode = (metadata?.promptMode ?? legacyMetadata?.promptMode ?? null) as PromptMode | null;
    const derivedFingerprint = derivePromptFingerprint(promptMode);

    const combinedPromptFingerprints = Object.entries(metadata?.promptFingerprints?.modelPromptFingerprints ?? {}).map(
      ([model, fingerprints]) => ({
        model,
        combinedPromptSha256: fingerprints.combinedPromptSha256 ?? null,
      })
    );

    const promptFingerprintRows = combinedPromptFingerprints.length > 0 ? combinedPromptFingerprints : derivedFingerprint?.combinedPromptFingerprints ?? [];
    const systemPromptSha256 = metadata?.promptFingerprints?.systemPromptSha256 ?? derivedFingerprint?.systemPromptSha256 ?? null;
    const providerName = metadata?.provider ?? provider.key.split("-")[0] ?? null;
    const providerModelIdentifier =
      metadata?.providerModelIdentifier ??
      legacyMetadata?.providerModelIdentifier ??
      legacyMetadata?.providerModel ??
      (providerName === "openai" ? process.env.OPENAI_MODEL ?? "gpt-4o" : providerName === "claude" ? process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20240620" : null);
    const generationParameters =
      metadata?.generationParameters ??
      legacyMetadata?.generationParameters ??
      (legacyMetadata?.maxTokens || legacyMetadata?.temperature
        ? {
            maxTokens: legacyMetadata.maxTokens,
            temperature: legacyMetadata.temperature,
          }
        : {
            maxTokens: 900,
            temperature: 0.8,
          });
    const retryPolicy =
      metadata?.retryPolicy ?? {
        maxProviderAttempts: 5,
        retryableStatusCodes: [408, 409, 429, 500, 502, 503, 504, 529],
      };

    return {
      key: provider.key,
      status: provider.status,
      reason: provider.reason ?? null,
      provider: providerName,
      promptMode,
      providerModelIdentifier,
      providerEndpoint: metadata?.providerEndpoint ?? null,
      systemPromptSha256,
      combinedPromptFingerprints: promptFingerprintRows,
      generationParameters,
      retryPolicy,
      retrySummary: metadata?.retrySummary ?? null,
    };
  });

  const completedArms = armMetadataEntries.filter((entry) => entry.status === "completed");
  const armCompleteness = {
    allCompletedArmsHaveProviderName: completedArms.every((entry) => typeof entry.provider === "string" && entry.provider.length > 0),
    allCompletedArmsHaveProviderModelIdentifier: completedArms.every(
      (entry) => typeof entry.providerModelIdentifier === "string" && entry.providerModelIdentifier.length > 0
    ),
    allCompletedArmsHaveSystemPromptFingerprint: completedArms.every(
      (entry) => typeof entry.systemPromptSha256 === "string" && entry.systemPromptSha256.length > 0
    ),
    allCompletedArmsHaveGenerationParameters: completedArms.every(
      (entry) => entry.generationParameters !== null && entry.generationParameters !== undefined
    ),
    allCompletedArmsHaveRetryPolicy: completedArms.every((entry) => entry.retryPolicy !== null && entry.retryPolicy !== undefined),
  };

  const manifest = {
    generatedAt: new Date().toISOString(),
    runtime: {
      nodeVersion,
      npmVersion,
      platform: process.platform,
      platformRelease,
      arch: process.arch,
      cpuModel: os.cpus()[0]?.model ?? "unknown",
      cpuCores: os.cpus().length,
      totalMemoryBytes: os.totalmem(),
      hostname: os.hostname(),
    },
    vcs: {
      gitCommit,
      gitBranch,
      dirtyWorkingTree: runCommand("git", ["status", "--porcelain"])?.length ? true : false,
    },
    dataStack: {
      databaseProvider: parseDatabaseProvider(process.env.DATABASE_URL),
      databaseUrlPresent: Boolean(process.env.DATABASE_URL),
      prismaClientVersion: packageJson.dependencies?.["@prisma/client"] ?? null,
      prismaCliVersion: packageJson.dependencies?.prisma ?? null,
      prismaVersion,
    },
    methodology: {
      governance,
      aiSampleCount: Number(process.env.AI_SAMPLE_COUNT ?? "30"),
      allowPartialAiMatrix: ["1", "true", "yes"].includes((process.env.AI_ALLOW_PARTIAL_MATRIX ?? "").toLowerCase()),
      runNormalization: {
        dependencyLockFilePresent: fs.existsSync(packageLockPath),
        dependencyLockSha256: packageLockSha256,
        expectedGenerationDefaults: {
          maxTokens: 900,
          temperature: 0.8,
          retryMaxAttempts: 5,
        },
      },
      generationMetadata,
      aiMatrix: {
        generatedAt: runSummary?.generatedAt ?? null,
        allowPartial: runSummary?.allowPartial ?? null,
        requiredArms: runSummary?.requiredArms ?? null,
        arms: armMetadataEntries,
        armCompleteness,
      },
    },
  };

  const outputPath = path.join(root, GENERATED_FILES.runManifest);
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${outputPath}`);
}

main();
