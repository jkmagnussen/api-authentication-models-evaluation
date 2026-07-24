import dotenv from 'dotenv';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { SAMPLE_COUNT, writeSampleFiles, writeResult } from './common';
import {
  GeneratorModel,
  PromptMode,
  getGeneratorPrompt,
  getSystemPrompt,
} from './generator-prompts';

dotenv.config({ override: true });

type Provider = 'openai' | 'claude';

const MODELS: GeneratorModel[] = ['oauth', 'jwt', 'sessions'];
const MAX_PROVIDER_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 750;
const MAX_RETRY_JITTER_MS = 250;
const REQUEST_TIMEOUT_MS = Number(process.env.AI_PROVIDER_REQUEST_TIMEOUT_MS ?? '120000');
const SAMPLE_TIMEOUT_MS = Number(process.env.AI_PROVIDER_SAMPLE_TIMEOUT_MS ?? '180000');
const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504, 529]);
const OFFLINE_FREEZE_LOCK_PATH = path.join(
  process.cwd(),
  'docs',
  'generated',
  'OFFLINE_FREEZE_LOCK.json'
);

type GenerationDiagnostics = {
  totalAttempts: number;
  successfulRequests: number;
  retries: number;
  retryableHttpFailures: number;
  networkFailures: number;
  requestTimeoutFailures: number;
  sampleTimeoutFailures: number;
};

class RequestTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}

class SampleTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SampleTimeoutError';
  }
}

function getArgValue(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function parseProvider(): Provider {
  const fromFlag = getArgValue('--provider');
  const fromPosition = process.argv
    .slice(2)
    .find((value) => value === 'openai' || value === 'claude');
  const value = (fromFlag ?? fromPosition ?? process.env.AI_PROVIDER ?? '').toLowerCase();

  if (value === 'openai' || value === 'claude') {
    return value;
  }

  throw new Error('Missing provider. Use --provider openai or --provider claude.');
}

function parseModels(): GeneratorModel[] {
  const fromFlag = getArgValue('--model');
  const raw = (fromFlag ?? process.env.AI_MODEL ?? 'all').toLowerCase();

  if (raw === 'all') return MODELS;
  if (raw === 'oauth' || raw === 'jwt' || raw === 'sessions') {
    return [raw];
  }

  throw new Error('Invalid model. Use --model oauth | jwt | sessions | all.');
}

function parsePromptMode(): PromptMode {
  const fromFlag = getArgValue('--prompt-mode');
  const raw = (fromFlag ?? process.env.AI_PROMPT_MODE ?? 'security-guided').toLowerCase();

  if (raw === 'neutral' || raw === 'security-guided') {
    return raw;
  }

  throw new Error(
    'Invalid prompt mode. Use --prompt-mode neutral or --prompt-mode security-guided.'
  );
}

function normalizeCode(text: string): string {
  const trimmed = text.trim();

  const fenced = trimmed.match(/^```(?:typescript|ts)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  return trimmed;
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutError: Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(timeoutError), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  context: string
): Promise<Response> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new RequestTimeoutError(`${context} timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function getRetryDelayMs(attempt: number): number {
  const exponentialDelay = BASE_RETRY_DELAY_MS * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * (MAX_RETRY_JITTER_MS + 1));
  return exponentialDelay + jitter;
}

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return 'Unable to read error response body.';
  }
}

function logRetry(
  provider: Provider,
  attempt: number,
  status: number,
  delayMs: number,
  context: string
): void {
  process.stdout.write(
    `[ai:${provider}] Retry ${attempt}/${MAX_PROVIDER_ATTEMPTS} for ${context} after HTTP ${status}; waiting ${delayMs}ms...\n`
  );
}

async function generateOpenAI(
  prompt: string,
  systemPrompt: string,
  diagnostics: GenerationDiagnostics
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  if (!apiKey) {
    throw new Error('OpenAI is not configured. Set OPENAI_API_KEY.');
  }

  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const url = `${normalizedBaseUrl}/chat/completions`;

  for (let attempt = 1; attempt <= MAX_PROVIDER_ATTEMPTS; attempt += 1) {
    diagnostics.totalAttempts += 1;
    let response: Response;

    try {
      response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            max_tokens: 900,
            temperature: 0.8,
          }),
        },
        REQUEST_TIMEOUT_MS,
        'OpenAI request'
      );
    } catch (error: unknown) {
      if (error instanceof RequestTimeoutError) {
        diagnostics.requestTimeoutFailures += 1;
      } else {
        diagnostics.networkFailures += 1;
      }
      if (attempt < MAX_PROVIDER_ATTEMPTS) {
        diagnostics.retries += 1;
        const delayMs = getRetryDelayMs(attempt);
        process.stdout.write(
          `[ai:openai] Retry ${attempt}/${MAX_PROVIDER_ATTEMPTS} after ${error instanceof RequestTimeoutError ? 'timeout' : 'network error'}; waiting ${delayMs}ms...\n`
        );
        await sleep(delayMs);
        continue;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`OpenAI request failed after network error: ${message}`);
    }

    if (!response.ok) {
      const message = await readErrorMessage(response);
      if (attempt < MAX_PROVIDER_ATTEMPTS && isRetryableStatus(response.status)) {
        diagnostics.retries += 1;
        diagnostics.retryableHttpFailures += 1;
        const delayMs = getRetryDelayMs(attempt);
        logRetry('openai', attempt, response.status, delayMs, 'OpenAI generation');
        await sleep(delayMs);
        continue;
      }

      throw new Error(`OpenAI request failed (${response.status}): ${message}`);
    }

    diagnostics.successfulRequests += 1;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI response did not include code content.');
    }

    return normalizeCode(content);
  }

  throw new Error('OpenAI request failed after retries.');
}

async function generateClaude(
  prompt: string,
  systemPrompt: string,
  diagnostics: GenerationDiagnostics
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20240620';

  if (!apiKey) {
    throw new Error('Anthropic is not configured. Set ANTHROPIC_API_KEY.');
  }

  for (let attempt = 1; attempt <= MAX_PROVIDER_ATTEMPTS; attempt += 1) {
    diagnostics.totalAttempts += 1;
    let response: Response;

    try {
      response = await fetchWithTimeout(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 900,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
          }),
        },
        REQUEST_TIMEOUT_MS,
        'Anthropic request'
      );
    } catch (error: unknown) {
      if (error instanceof RequestTimeoutError) {
        diagnostics.requestTimeoutFailures += 1;
      } else {
        diagnostics.networkFailures += 1;
      }
      if (attempt < MAX_PROVIDER_ATTEMPTS) {
        diagnostics.retries += 1;
        const delayMs = getRetryDelayMs(attempt);
        process.stdout.write(
          `[ai:claude] Retry ${attempt}/${MAX_PROVIDER_ATTEMPTS} after ${error instanceof RequestTimeoutError ? 'timeout' : 'network error'}; waiting ${delayMs}ms...\n`
        );
        await sleep(delayMs);
        continue;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Anthropic request failed after network error: ${message}`);
    }

    if (!response.ok) {
      const message = await readErrorMessage(response);
      if (attempt < MAX_PROVIDER_ATTEMPTS && isRetryableStatus(response.status)) {
        diagnostics.retries += 1;
        diagnostics.retryableHttpFailures += 1;
        const delayMs = getRetryDelayMs(attempt);
        logRetry('claude', attempt, response.status, delayMs, 'Claude generation');
        await sleep(delayMs);
        continue;
      }

      throw new Error(`Anthropic request failed (${response.status}): ${message}`);
    }

    diagnostics.successfulRequests += 1;

    const data = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      output_text?: string;
    };

    const blockText = data.content
      ?.map((entry) => (typeof entry.text === 'string' ? entry.text : ''))
      .filter((value) => value.length > 0)
      .join('\n')
      .trim();
    const text = (blockText && blockText.length > 0 ? blockText : data.output_text)?.trim();

    if (!text) {
      const contentTypes =
        data.content?.map((entry) => entry.type ?? 'unknown').join(', ') ?? 'none';
      throw new Error(
        `Anthropic response did not include code content. Content types: ${contentTypes}`
      );
    }

    return normalizeCode(text);
  }

  throw new Error('Anthropic request failed after retries.');
}

async function generateSample(
  provider: Provider,
  model: GeneratorModel,
  promptMode: PromptMode,
  sampleNumber: number,
  diagnostics: GenerationDiagnostics
): Promise<string> {
  const modelPrompt = getGeneratorPrompt(model, promptMode);
  const systemPrompt = getSystemPrompt(promptMode);
  const prompt = [
    modelPrompt,
    `Generate sample ${sampleNumber} of ${SAMPLE_COUNT}.`,
    promptMode === 'security-guided'
      ? 'Vary structure and naming from prior samples while preserving secure behavior.'
      : 'Vary structure and naming from prior samples while keeping the implementation plausible and internally consistent.',
  ].join('\n');

  if (provider === 'openai') {
    return generateOpenAI(prompt, systemPrompt, diagnostics);
  }

  return generateClaude(prompt, systemPrompt, diagnostics);
}

async function generateForModel(
  provider: Provider,
  model: GeneratorModel,
  promptMode: PromptMode,
  diagnostics: GenerationDiagnostics
): Promise<void> {
  const samples: string[] = [];

  for (let index = 1; index <= SAMPLE_COUNT; index += 1) {
    process.stdout.write(
      `[ai:${provider}:${promptMode}] Generating ${model} sample ${index}/${SAMPLE_COUNT}...\n`
    );
    let code: string;
    try {
      code = await withTimeout(
        generateSample(provider, model, promptMode, index, diagnostics),
        SAMPLE_TIMEOUT_MS,
        new SampleTimeoutError(
          `Timed out while generating ${model} sample ${index}/${SAMPLE_COUNT} for ${provider}/${promptMode} after ${SAMPLE_TIMEOUT_MS}ms.`
        )
      );
    } catch (error: unknown) {
      if (error instanceof SampleTimeoutError) {
        diagnostics.sampleTimeoutFailures += 1;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed ${model} sample ${index}/${SAMPLE_COUNT} for ${provider}/${promptMode}: ${message}`
      );
    }
    samples.push(code);
  }

  writeSampleFiles(model, samples);
}

async function main() {
  const offlineLockExists = fs.existsSync(OFFLINE_FREEZE_LOCK_PATH);
  const allowOverride = (process.env.ALLOW_LIVE_AI_GENERATION ?? '').toLowerCase() === 'true';
  if (offlineLockExists && !allowOverride) {
    throw new Error(
      'Offline freeze lock is active at docs/generated/OFFLINE_FREEZE_LOCK.json. ' +
        'Live provider generation is blocked. Remove the lock intentionally or set ALLOW_LIVE_AI_GENERATION=true to override.'
    );
  }

  const provider = parseProvider();
  const models = parseModels();
  const promptMode = parsePromptMode();
  const startedAt = new Date().toISOString();
  const providerModel =
    provider === 'openai'
      ? (process.env.OPENAI_MODEL ?? 'gpt-4o')
      : (process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20240620');
  const openAiTemperature = 0.8;
  const maxTokens = 900;
  const diagnostics: GenerationDiagnostics = {
    totalAttempts: 0,
    successfulRequests: 0,
    retries: 0,
    retryableHttpFailures: 0,
    networkFailures: 0,
    requestTimeoutFailures: 0,
    sampleTimeoutFailures: 0,
  };

  const systemPrompt = getSystemPrompt(promptMode);
  const modelPromptFingerprints = Object.fromEntries(
    models.map((model) => {
      const modelPrompt = getGeneratorPrompt(model, promptMode);
      return [
        model,
        {
          promptSha256: sha256(modelPrompt),
          systemPromptSha256: sha256(systemPrompt),
          combinedPromptSha256: sha256(`${systemPrompt}\n${modelPrompt}`),
        },
      ];
    })
  );

  for (const model of models) {
    await generateForModel(provider, model, promptMode, diagnostics);
  }

  writeResult('generation-metadata.json', {
    generatedAt: new Date().toISOString(),
    startedAt,
    provider,
    providerModel,
    providerModelIdentifier: providerModel,
    providerEndpoint:
      provider === 'openai'
        ? (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1')
        : 'https://api.anthropic.com/v1/messages',
    promptMode,
    models,
    sampleCount: SAMPLE_COUNT,
    generationParameters: {
      temperature: openAiTemperature,
      maxTokens,
    },
    promptFingerprints: {
      promptMode,
      systemPromptSha256: sha256(systemPrompt),
      modelPromptFingerprints,
    },
    retryPolicy: {
      maxProviderAttempts: MAX_PROVIDER_ATTEMPTS,
      baseRetryDelayMs: BASE_RETRY_DELAY_MS,
      maxRetryJitterMs: MAX_RETRY_JITTER_MS,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      sampleTimeoutMs: SAMPLE_TIMEOUT_MS,
      retryableStatusCodes: Array.from(RETRYABLE_STATUS_CODES.values()).sort((a, b) => a - b),
    },
    retrySummary: diagnostics,
  });

  console.log(
    `Generated ${SAMPLE_COUNT} samples per model using provider: ${provider}, prompt mode: ${promptMode}.`
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ai:generate:provider] ${message}`);
  process.exit(1);
});
