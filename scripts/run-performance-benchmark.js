const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PERFORMANCE_ROOT = path.join(process.cwd(), 'docs', 'performance-results');
const RUNS_ROOT = path.join(PERFORMANCE_ROOT, 'runs');
// A protocol bump keeps measurements from changed workloads or auth code out of older analyses.
const PERFORMANCE_PROTOCOL_VERSION = 7;
const PERFORMANCE_SOURCE_FILES = [
  'package-lock.json',
  'prisma/schema.prisma',
  'scripts/run-performance-benchmark.js',
  'src/app.ts',
  'src/config.ts',
  'src/db.ts',
  'src/jwt/jwt.controller.ts',
  'src/jwt/jwt.keys.ts',
  'src/jwt/jwt.middleware.ts',
  'src/jwt/jwt.service.ts',
  'src/oauth/oauth.controller.ts',
  'src/oauth/oauth.middleware.ts',
  'src/oauth/oauth.service.ts',
  'src/sessions/session.service.ts',
  'src/sessions/sessions.controller.ts',
  'src/sessions/sessions.middleware.ts',
  'tests/performance/attacks/jwt.attacks.performance.test.ts',
  'tests/performance/attacks/oauth.attacks.performance.test.ts',
  'tests/performance/attacks/sessions.attacks.performance.test.ts',
  'tests/performance/baseline/jwt.performance.test.ts',
  'tests/performance/baseline/oauth.performance.test.ts',
  'tests/performance/baseline/sessions.performance.test.ts',
  'tests/performance/utils.ts',
  'tests/setup.ts',
];
const CONDITION_TESTS = {
  baseline: [
    'tests/performance/baseline/jwt.performance.test.ts',
    'tests/performance/baseline/oauth.performance.test.ts',
    'tests/performance/baseline/sessions.performance.test.ts',
  ],
  attacks: [
    'tests/performance/attacks/jwt.attacks.performance.test.ts',
    'tests/performance/attacks/oauth.attacks.performance.test.ts',
    'tests/performance/attacks/sessions.attacks.performance.test.ts',
  ],
};

function saveMetadata(metadataPath, metadata) {
  const temporaryPath = `${metadataPath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(metadata, null, 2));
  fs.renameSync(temporaryPath, metadataPath);
}

function protocolRunCount() {
  if (!fs.existsSync(RUNS_ROOT)) return 0;
  return fs.readdirSync(RUNS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const metadataPath = path.join(RUNS_ROOT, entry.name, 'metadata.json');
      if (!fs.existsSync(metadataPath)) return null;
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        return metadata.protocolVersion === PERFORMANCE_PROTOCOL_VERSION &&
          metadata.matchedBlockVerified === true &&
          metadata.status === 'completed';
      } catch {
        return false;
      }
    })
    .filter(Boolean).length;
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--run-id') {
      options.runId = args[index + 1];
      index += 1;
    } else if (args[index] === '--condition-order') {
      options.conditionOrder = args[index + 1];
      index += 1;
    } else if (args[index] === '--help' || args[index] === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown option: ${args[index]}`);
    }
  }
  return options;
}

function makeRunId() {
  return `run-${new Date().toISOString().replace(/[-:.]/g, '')}`;
}

function createMetadata(runId, conditionOrder, orderPolicy) {
  const startedAt = new Date().toISOString();
  const cpus = os.cpus();
  // Fingerprint the code and schema used for this block so later edits cannot silently redefine it.
  const sourceSha256 = Object.fromEntries(PERFORMANCE_SOURCE_FILES.map((relativePath) => {
    const filePath = path.join(process.cwd(), relativePath);
    return [relativePath, crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')];
  }));
  const gitCommit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: process.cwd(), encoding: 'utf8' });
  const gitStatus = spawnSync('git', ['status', '--porcelain'], { cwd: process.cwd(), encoding: 'utf8' });
  return {
    runId,
    protocolVersion: PERFORMANCE_PROTOCOL_VERSION,
    matchedBlockVerified: true,
    runUnit: 'One invocation containing all mechanisms under both conditions; each suite reuses one localhost server and keep-alive connection.',
    startedAt,
    completedAt: null,
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      platformRelease: os.release(),
      arch: process.arch,
    },
    host: {
      hostname: os.hostname(),
      cpuModel: cpus[0]?.model ?? 'unknown',
      cpuCores: cpus.length,
      totalMemoryBytes: os.totalmem(),
    },
    sourceProvenance: {
      gitCommit: gitCommit.status === 0 ? gitCommit.stdout.trim() : null,
      workingTreeDirty: gitStatus.status === 0 ? gitStatus.stdout.trim().length > 0 : null,
      sourceSha256,
    },
    warmup: 'none',
    httpConnectionPolicy: 'One app server and one keep-alive TCP connection per test suite; maxSockets=1.',
    conditionOrder,
    conditionOrderPolicy: orderPolicy,
    conditions: Object.fromEntries(conditionOrder.map((condition, order) => [condition, {
      order: order + 1,
      status: 'pending',
      startedAt: null,
      completedAt: null,
    }])),
    notes: 'Both conditions are collected within this invocation. Timed requests reuse one local HTTP server and keep-alive connection. No warm-up requests are used.',
  };
}

function runCondition(condition, runId, metadata, metadataPath) {
  const phase = metadata.conditions[condition];
  phase.status = 'running';
  phase.startedAt = new Date().toISOString();
  saveMetadata(metadataPath, metadata);

  const jestCli = path.join(process.cwd(), 'node_modules', 'jest', 'bin', 'jest.js');
  const env = {
    ...process.env,
    PERF_RUN_ID: runId,
    PERF_CONDITION: condition,
    PERF_CONDITION_ORDER: metadata.conditionOrder.join(','),
    PERF_PROTOCOL_VERSION: String(PERFORMANCE_PROTOCOL_VERSION),
  };
  const result = spawnSync(process.execPath, [jestCli, '--runInBand', '--forceExit', '--testTimeout=30000', '--testPathIgnorePatterns=^$', '--runTestsByPath', ...CONDITION_TESTS[condition]], {
    cwd: process.cwd(),
    env,
    stdio: 'inherit',
  });

  phase.completedAt = new Date().toISOString();
  phase.status = result.status === 0 ? 'completed' : 'failed';
  phase.exitCode = result.status;
  saveMetadata(metadataPath, metadata);
  return result.status ?? 1;
}

function printHelp() {
  console.log('Usage: npm run perf:once -- [--run-id <id>] [--condition-order baseline-first|attacks-first]');
  console.log('Without an explicit order, verified blocks alternate condition order. Warm-up is recorded as none.');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (options.conditionOrder && !['baseline-first', 'attacks-first'].includes(options.conditionOrder)) {
    throw new Error('--condition-order must be baseline-first or attacks-first');
  }

  const runId = options.runId ?? makeRunId();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(runId)) {
    throw new Error('Run ID may contain only letters, numbers, underscores, and hyphens.');
  }

  const runDir = path.join(RUNS_ROOT, runId);
  if (fs.existsSync(runDir)) {
    throw new Error(`Run ID '${runId}' already exists; choose a new ID to avoid overwriting evidence.`);
  }

  fs.mkdirSync(runDir, { recursive: true });
  const metadataPath = path.join(runDir, 'metadata.json');
  const isBaselineFirst = options.conditionOrder
    ? options.conditionOrder === 'baseline-first'
    : protocolRunCount() % 2 === 0;
  const conditionOrder = isBaselineFirst ? ['baseline', 'attacks'] : ['attacks', 'baseline'];
  const orderPolicy = options.conditionOrder
    ? 'explicit command-line selection'
    : 'alternating order across protocol-verified blocks';
  const metadata = createMetadata(runId, conditionOrder, orderPolicy);
  saveMetadata(metadataPath, metadata);

  for (const condition of conditionOrder) {
    const exitCode = runCondition(condition, runId, metadata, metadataPath);
    if (exitCode !== 0) {
      metadata.completedAt = new Date().toISOString();
      metadata.status = 'failed';
      saveMetadata(metadataPath, metadata);
      process.exitCode = exitCode;
      return;
    }
  }

  metadata.completedAt = new Date().toISOString();
  metadata.status = 'completed';
  saveMetadata(metadataPath, metadata);
  console.log(`Completed matched performance block '${runId}' (${conditionOrder.join(' -> ')}).`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}