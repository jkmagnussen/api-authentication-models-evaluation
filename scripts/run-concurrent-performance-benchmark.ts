import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';
import { createPkcePair } from '../src/oauth/pkce';
import { resetDatabase } from '../tests/setup';
import { calculateStats, createPerformanceHttpClient } from '../tests/performance/utils';

const STUDY_ROOT = path.join(process.cwd(), 'docs', 'performance-results', 'concurrent-load-v1');
const MODELS = ['jwt', 'oauth', 'sessions'] as const;
const CONDITIONS = ['baseline', 'attacks'] as const;
const DEFAULT_CONCURRENCY_LEVELS = [1, 10, 50];
const DEFAULT_REQUESTS = 1000;
const DEFAULT_WARMUP_REQUESTS = 100;

type Model = typeof MODELS[number];
type Condition = typeof CONDITIONS[number];

type Options = {
  runId: string;
  requests: number;
  warmupRequests: number;
  concurrencyLevels: number[];
  pilot: boolean;
  analyze: boolean;
};

type Credentials = Record<Model, { path: string; headers: Record<string, string> }>;

type CellResult = {
  model: Model;
  condition: Condition;
  concurrency: number;
  expectedStatus: number;
  warmupRequests: number;
  measurementRequests: number;
  unexpectedStatusCount: number;
  actualElapsedMs: number;
  actualRequestsPerSecond: number;
  meanLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  latencySamplesMs: number[];
};

type SavedRun = {
  runId: string;
  protocolVersion: 1;
  status: 'completed' | 'failed';
  startedAt: string;
  completedAt: string;
  runtime: Record<string, string>;
  host: Record<string, string | number>;
  workload: {
    requestsPerCell: number;
    warmupRequestsPerCell: number;
    concurrencyLevels: number[];
    transport: string;
  };
  conditionOrder: Condition[];
  mechanismOrder: Model[];
  concurrencyOrder: number[];
  results: CellResult[];
  failure?: string;
};

function parseOptions(args: string[]): Options {
  const options: Partial<Options> = {
    requests: DEFAULT_REQUESTS,
    warmupRequests: DEFAULT_WARMUP_REQUESTS,
    concurrencyLevels: DEFAULT_CONCURRENCY_LEVELS,
    pilot: false,
    analyze: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--run-id') {
      options.runId = args[++index];
    } else if (argument === '--requests') {
      options.requests = Number(args[++index]);
    } else if (argument === '--warmup') {
      options.warmupRequests = Number(args[++index]);
    } else if (argument === '--concurrency-levels') {
      options.concurrencyLevels = args[++index].split(',').map(Number);
    } else if (argument === '--pilot') {
      options.pilot = true;
    } else if (argument === '--analyze') {
      options.analyze = true;
    } else if (argument === '--help' || argument === '-h') {
      console.log('Usage: npm run perf:concurrent -- [--run-id ID] [--requests N] [--warmup N] [--concurrency-levels 1,10,50] [--pilot]');
      console.log('       npm run perf:concurrent -- --analyze');
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${argument}`);
    }
  }

  if (!Number.isInteger(options.requests) || (options.requests ?? 0) < 1) throw new Error('--requests must be a positive integer.');
  if (!Number.isInteger(options.warmupRequests) || (options.warmupRequests ?? -1) < 0) throw new Error('--warmup must be a non-negative integer.');
  if (!options.concurrencyLevels?.length || options.concurrencyLevels.some((value) => !Number.isInteger(value) || value < 1)) {
    throw new Error('--concurrency-levels must be comma-separated positive integers.');
  }
  if (new Set(options.concurrencyLevels).size !== options.concurrencyLevels.length) throw new Error('Concurrency levels must be unique.');

  return {
    runId: options.runId ?? `concurrent-v1-${new Date().toISOString().replace(/[-:.]/g, '')}`,
    requests: options.requests as number,
    warmupRequests: options.warmupRequests as number,
    concurrencyLevels: options.concurrencyLevels,
    pilot: options.pilot ?? false,
    analyze: options.analyze ?? false,
  };
}

function saveJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporaryPath, filePath);
}

function rotate<T>(values: T[], offset: number) {
  // Rotate independent ordering dimensions across blocks to avoid always warming the same model first.
  const normalizedOffset = offset % values.length;
  return [...values.slice(normalizedOffset), ...values.slice(0, normalizedOffset)];
}

function runNumber(runId: string) {
  const match = runId.match(/(\d+)$/);
  return match ? Number(match[1]) : 1;
}

async function prepareCredentials(): Promise<Credentials> {
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  await resetDatabase();
  await prisma.user.create({
    data: { id: userId, email: 'concurrent-perf@example.com', password: 'password' },
  });

  const jwtLogin = await request(app).post('/jwt/login').send({ email: 'concurrent-perf@example.com', password: 'password' });
  if (jwtLogin.status !== 200 || typeof jwtLogin.body.token !== 'string') throw new Error(`JWT setup failed with status ${jwtLogin.status}`);

  const sessionLogin = await request(app).post('/sessions/login').send({ email: 'concurrent-perf@example.com', password: 'password' });
  const sessionCookies = sessionLogin.headers['set-cookie'];
  if (sessionLogin.status !== 200 || !sessionCookies?.length) throw new Error(`Sessions setup failed with status ${sessionLogin.status}`);

  const { code_verifier, code_challenge } = await createPkcePair();
  const authorize = await request(app).post('/oauth/authorize').send({
    userId,
    clientId: 'client-basic',
    scope: 'read',
    code_challenge,
    code_challenge_method: 'S256',
  });
  if (authorize.status !== 200 || typeof authorize.body.code !== 'string') throw new Error(`OAuth authorize setup failed with status ${authorize.status}`);
  const token = await request(app).post('/oauth/token').send({
    code: authorize.body.code,
    clientId: 'client-basic',
    code_verifier,
  });
  if (token.status !== 200 || typeof token.body.access_token !== 'string') throw new Error(`OAuth token setup failed with status ${token.status}`);

  return {
    jwt: {
      path: '/jwt/protected',
      headers: { Authorization: `Bearer ${jwtLogin.body.token}` },
    },
    oauth: {
      path: '/oauth/protected',
      headers: { Authorization: `Bearer ${token.body.access_token}` },
    },
    sessions: {
      path: '/sessions/protected',
      headers: { Cookie: String(sessionCookies[0]).split(';')[0] },
    },
  };
}

function getRequestHeaders(model: Model, condition: Condition, credentials: Credentials) {
  if (condition === 'baseline') return credentials[model].headers;
  if (model === 'jwt') return { Authorization: 'Bearer invalid.concurrent.jwt' };
  if (model === 'oauth') return { Authorization: 'Bearer INVALID_CONCURRENT_OAUTH_TOKEN' };
  return { Cookie: 'sessionId=INVALID_CONCURRENT_SESSION_ID' };
}

async function runRequests(
  client: Awaited<ReturnType<typeof createPerformanceHttpClient>>,
  pathname: string,
  headers: Record<string, string>,
  expectedStatus: number,
  requestCount: number,
  concurrency: number,
  captureLatencies: boolean
) {
  let nextRequest = 0;
  let unexpectedStatusCount = 0;
  const latencies = captureLatencies ? new Array<number>(requestCount) : [];
  const startedAt = performance.now();

  // Fixed workers share a monotonic request index; latency is per request while RPS uses total cell wall time.
  const workers = Array.from({ length: Math.min(concurrency, requestCount) }, async () => {
    while (true) {
      const requestIndex = nextRequest;
      nextRequest += 1;
      if (requestIndex >= requestCount) return;

      const requestStartedAt = performance.now();
      const status = await client.get(pathname, headers);
      const latency = performance.now() - requestStartedAt;
      if (captureLatencies) latencies[requestIndex] = latency;
      if (status !== expectedStatus) unexpectedStatusCount += 1;
    }
  });

  await Promise.all(workers);
  const actualElapsedMs = performance.now() - startedAt;
  return { latencies, actualElapsedMs, unexpectedStatusCount };
}

function summarizeCell(
  model: Model,
  condition: Condition,
  concurrency: number,
  expectedStatus: number,
  warmupRequests: number,
  measurementRequests: number,
  measurements: Awaited<ReturnType<typeof runRequests>>
): CellResult {
  const sortedLatencies = [...measurements.latencies].sort((left, right) => left - right);
  const stats = calculateStats([...sortedLatencies]);
  return {
    model,
    condition,
    concurrency,
    expectedStatus,
    warmupRequests,
    measurementRequests,
    unexpectedStatusCount: measurements.unexpectedStatusCount,
    actualElapsedMs: measurements.actualElapsedMs,
    actualRequestsPerSecond: measurementRequests / (measurements.actualElapsedMs / 1000),
    meanLatencyMs: stats.avg,
    p50LatencyMs: sortedLatencies[Math.floor(sortedLatencies.length * 0.50)],
    p95LatencyMs: stats.p95,
    p99LatencyMs: stats.p99,
    latencySamplesMs: measurements.latencies,
  };
}

async function runConcurrentBlock(options: Options) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(options.runId)) throw new Error('Run ID may contain only letters, numbers, underscores, and hyphens.');
  const root = path.join(STUDY_ROOT, options.pilot ? 'pilots' : 'runs');
  const outputPath = path.join(root, `${options.runId}.json`);
  if (fs.existsSync(outputPath)) throw new Error(`Run '${options.runId}' already exists; choose a unique ID.`);

  const number = runNumber(options.runId);
  const conditionOrder: Condition[] = number % 2 === 1 ? ['baseline', 'attacks'] : ['attacks', 'baseline'];
  const mechanismOrder = rotate([...MODELS], number - 1);
  const concurrencyOrder = rotate([...options.concurrencyLevels], number - 1);
  const cpus = os.cpus();
  const startedAt = new Date().toISOString();
  const results: CellResult[] = [];
  let client: Awaited<ReturnType<typeof createPerformanceHttpClient>> | undefined;
  const run: SavedRun = {
    runId: options.runId,
    protocolVersion: 1,
    status: 'failed',
    startedAt,
    completedAt: startedAt,
    runtime: { nodeVersion: process.version, platform: process.platform, platformRelease: os.release(), arch: process.arch },
    host: { hostname: os.hostname(), cpuModel: cpus[0]?.model ?? 'unknown', cpuCores: cpus.length, totalMemoryBytes: os.totalmem() },
    workload: {
      requestsPerCell: options.requests,
      warmupRequestsPerCell: options.warmupRequests,
      concurrencyLevels: options.concurrencyLevels,
      transport: 'Single local HTTP server per block; keep-alive agent with maxSockets equal to maximum tested concurrency.',
    },
    conditionOrder,
    mechanismOrder,
    concurrencyOrder,
    results,
  };

  try {
    const credentials = await prepareCredentials();
    client = await createPerformanceHttpClient(app, Math.max(...options.concurrencyLevels));

    for (const condition of conditionOrder) {
      const expectedStatus = condition === 'baseline' ? 200 : 401;
      for (const model of mechanismOrder) {
        for (const concurrency of concurrencyOrder) {
          const headers = getRequestHeaders(model, condition, credentials);
          const route = credentials[model].path;
          if (options.warmupRequests > 0) {
            // Warm-up requests exercise connections/caches but are excluded from measured samples and RPS.
            const warmup = await runRequests(client, route, headers, expectedStatus, options.warmupRequests, concurrency, false);
            if (warmup.unexpectedStatusCount > 0) throw new Error(`${model}/${condition} warm-up returned unexpected HTTP statuses.`);
          }
          const measurements = await runRequests(client, route, headers, expectedStatus, options.requests, concurrency, true);
          const cell = summarizeCell(model, condition, concurrency, expectedStatus, options.warmupRequests, options.requests, measurements);
          results.push(cell);
          console.log(`${model} ${condition} c=${concurrency}: ${cell.actualRequestsPerSecond.toFixed(1)} req/s, p95=${cell.p95LatencyMs.toFixed(2)} ms, unexpected=${cell.unexpectedStatusCount}`);
          saveJson(outputPath, run);
        }
      }
    }

    run.status = 'completed';
    run.completedAt = new Date().toISOString();
    saveJson(outputPath, run);
    console.log(`Completed concurrent-load block '${options.runId}'.`);
  } catch (error) {
    run.status = 'failed';
    run.completedAt = new Date().toISOString();
    run.failure = error instanceof Error ? error.message : String(error);
    saveJson(outputPath, run);
    throw error;
  } finally {
    if (client) await client.close();
    await prisma.$disconnect();
  }
}

function mean(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function analyzeConcurrentRuns() {
  const runsRoot = path.join(STUDY_ROOT, 'runs');
  const runs: SavedRun[] = fs.existsSync(runsRoot)
    ? fs.readdirSync(runsRoot).filter((file) => file.endsWith('.json')).map((file) => JSON.parse(fs.readFileSync(path.join(runsRoot, file), 'utf8')) as SavedRun).filter((run) => run.status === 'completed')
    : [];
  const rows: Array<Record<string, number | string>> = [];

  for (const model of MODELS) {
    for (const concurrency of DEFAULT_CONCURRENCY_LEVELS) {
      const paired = runs.flatMap((run) => {
        const baseline = run.results.find((result) => result.model === model && result.condition === 'baseline' && result.concurrency === concurrency);
        const attacks = run.results.find((result) => result.model === model && result.condition === 'attacks' && result.concurrency === concurrency);
        if (!baseline || !attacks) return [];
        return [{ baseline, attacks }];
      });
      if (paired.length === 0) continue;
      // Keep this five-block concurrent extension descriptive; protocol-v7 sequential inference is separate.
      const baselineRps = mean(paired.map((pair) => pair.baseline.actualRequestsPerSecond));
      const attackRps = mean(paired.map((pair) => pair.attacks.actualRequestsPerSecond));
      const pairedRpsDeltas = paired.map((pair) => ((pair.attacks.actualRequestsPerSecond - pair.baseline.actualRequestsPerSecond) / pair.baseline.actualRequestsPerSecond) * 100);
      rows.push({
        model,
        concurrency,
        blocks: paired.length,
        baseline_mean_rps: baselineRps,
        attacks_mean_rps: attackRps,
        mean_paired_rps_delta_pct: mean(pairedRpsDeltas),
        baseline_mean_latency_ms: mean(paired.map((pair) => pair.baseline.meanLatencyMs)),
        attacks_mean_latency_ms: mean(paired.map((pair) => pair.attacks.meanLatencyMs)),
        baseline_mean_p95_ms: mean(paired.map((pair) => pair.baseline.p95LatencyMs)),
        attacks_mean_p95_ms: mean(paired.map((pair) => pair.attacks.p95LatencyMs)),
        baseline_mean_unexpected_status_pct: mean(paired.map((pair) => pair.baseline.unexpectedStatusCount / pair.baseline.measurementRequests * 100)),
        attacks_mean_unexpected_status_pct: mean(paired.map((pair) => pair.attacks.unexpectedStatusCount / pair.attacks.measurementRequests * 100)),
      });
    }
  }

  const outputRoot = STUDY_ROOT;
  fs.mkdirSync(outputRoot, { recursive: true });
  const csvHeader = ['model', 'concurrency', 'blocks', 'baseline_mean_rps', 'attacks_mean_rps', 'mean_paired_rps_delta_pct', 'baseline_mean_latency_ms', 'attacks_mean_latency_ms', 'baseline_mean_p95_ms', 'attacks_mean_p95_ms', 'baseline_mean_unexpected_status_pct', 'attacks_mean_unexpected_status_pct'];
  const csvRows = [csvHeader.join(','), ...rows.map((row) => csvHeader.map((column) => row[column]).join(','))];
  fs.writeFileSync(path.join(outputRoot, 'summary.csv'), `${csvRows.join('\n')}\n`);

  const report = [
    '# Concurrent Load Study (Exploratory)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'This is a separate concurrent workload; it is not pooled with protocol-v4 sequential latency results. Each run warms each model/condition/concurrency cell, then measures concurrent protected-resource traffic and actual completed requests per second. Baseline requests should return HTTP 200; invalid-credential attacks should return HTTP 401. Unexpected status rates are reported rather than filtered.',
    '',
    'Results are descriptive by matched block. No significance claims are made from this exploratory run set. The benchmark runs on one local host and does not represent production network or deployment capacity.',
    '',
    '| Model | Concurrency | Blocks | Baseline mean RPS | Attack mean RPS | Mean paired RPS delta % | Baseline mean latency ms | Attack mean latency ms | Baseline mean p95 ms | Attack mean p95 ms | Baseline unexpected % | Attack unexpected % |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...rows.map((row) => `| ${String(row.model).toUpperCase()} | ${row.concurrency} | ${row.blocks} | ${Number(row.baseline_mean_rps).toFixed(1)} | ${Number(row.attacks_mean_rps).toFixed(1)} | ${Number(row.mean_paired_rps_delta_pct).toFixed(2)} | ${Number(row.baseline_mean_latency_ms).toFixed(3)} | ${Number(row.attacks_mean_latency_ms).toFixed(3)} | ${Number(row.baseline_mean_p95_ms).toFixed(3)} | ${Number(row.attacks_mean_p95_ms).toFixed(3)} | ${Number(row.baseline_mean_unexpected_status_pct).toFixed(2)} | ${Number(row.attacks_mean_unexpected_status_pct).toFixed(2)} |`),
    '',
    'Raw per-request latencies, condition ordering, warm-up counts, concurrency, runtime, and host metadata are preserved in `runs/`.',
  ].join('\n');
  fs.writeFileSync(path.join(outputRoot, 'analysis.md'), `${report}\n`);
  console.log(`Analyzed ${runs.length} complete concurrent-load blocks.`);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.analyze) {
    analyzeConcurrentRuns();
    return;
  }
  await runConcurrentBlock(options);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});