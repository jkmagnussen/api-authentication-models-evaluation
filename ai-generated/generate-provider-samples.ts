import { SAMPLE_COUNT, writeSampleFiles, writeResult } from "./common";
import { GENERATOR_PROMPTS, GeneratorModel, SECURE_TYPESCRIPT_SYSTEM_PROMPT } from "./generator-prompts";

type Provider = "azure" | "claude";

const MODELS: GeneratorModel[] = ["oauth", "jwt", "sessions"];

function getArgValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function parseProvider(): Provider {
  const fromFlag = getArgValue("--provider");
  const fromPosition = process.argv.slice(2).find((value) => value === "azure" || value === "claude");
  const value = (fromFlag ?? fromPosition ?? process.env.AI_PROVIDER ?? "").toLowerCase();

  if (value === "azure" || value === "claude") {
    return value;
  }

  throw new Error("Missing provider. Use --provider azure or --provider claude.");
}

function parseModels(): GeneratorModel[] {
  const fromFlag = getArgValue("--model");
  const raw = (fromFlag ?? process.env.AI_MODEL ?? "all").toLowerCase();

  if (raw === "all") return MODELS;
  if (raw === "oauth" || raw === "jwt" || raw === "sessions") {
    return [raw];
  }

  throw new Error("Invalid model. Use --model oauth | jwt | sessions | all.");
}

function normalizeCode(text: string): string {
  const trimmed = text.trim();

  const fenced = trimmed.match(/^```(?:typescript|ts)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  return trimmed;
}

async function generateAzure(prompt: string): Promise<string> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-10-21";

  if (!endpoint || !apiKey) {
    throw new Error("Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.");
  }

  const normalizedEndpoint = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
  const url = `${normalizedEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: SECURE_TYPESCRIPT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: 900,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Azure OpenAI request failed (${response.status}): ${message}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Azure OpenAI response did not include code content.");
  }

  return normalizeCode(content);
}

async function generateClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20240620";

  if (!apiKey) {
    throw new Error("Anthropic is not configured. Set ANTHROPIC_API_KEY.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      temperature: 0.8,
      system: SECURE_TYPESCRIPT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Anthropic request failed (${response.status}): ${message}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const textBlock = data.content?.find((entry) => entry.type === "text")?.text;
  if (!textBlock) {
    throw new Error("Anthropic response did not include code content.");
  }

  return normalizeCode(textBlock);
}

async function generateSample(provider: Provider, model: GeneratorModel, sampleNumber: number): Promise<string> {
  const modelPrompt = GENERATOR_PROMPTS[model];
  const prompt = [
    modelPrompt,
    `Generate sample ${sampleNumber} of ${SAMPLE_COUNT}.`,
    "Vary structure and naming from prior samples while preserving secure behavior.",
  ].join("\n");

  if (provider === "azure") {
    return generateAzure(prompt);
  }

  return generateClaude(prompt);
}

async function generateForModel(provider: Provider, model: GeneratorModel): Promise<void> {
  const samples: string[] = [];

  for (let index = 1; index <= SAMPLE_COUNT; index += 1) {
    process.stdout.write(`[ai:${provider}] Generating ${model} sample ${index}/${SAMPLE_COUNT}...\n`);
    const code = await generateSample(provider, model, index);
    samples.push(code);
  }

  writeSampleFiles(model, samples);
}

async function main() {
  const provider = parseProvider();
  const models = parseModels();
  const startedAt = new Date().toISOString();

  for (const model of models) {
    await generateForModel(provider, model);
  }

  writeResult("generation-metadata.json", {
    generatedAt: new Date().toISOString(),
    startedAt,
    provider,
    models,
    sampleCount: SAMPLE_COUNT,
  });

  console.log(`Generated ${SAMPLE_COUNT} samples per model using provider: ${provider}.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ai:generate:provider] ${message}`);
  process.exit(1);
});
