import fs from 'fs';
import path from 'path';

export function calculateStats(times: number[]) {
  times.sort((a, b) => a - b);

  const total = times.reduce((a, b) => a + b, 0);
  const avg = total / times.length;

  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];

  const throughput = 1000 / avg; // requests per second

  return { avg, p95, p99, throughput };
}

type PerfKind = 'baseline' | 'attacks';

export function writePerformanceResult(
  kind: PerfKind,
  model: string,
  stats: Record<string, number>,
  rawTimes?: number[],
  outputRoot = 'docs/performance-results'
) {
  const outputDir = path.join(outputRoot, kind);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, `${model}.json`), JSON.stringify(stats, null, 2));

  if (rawTimes) {
    const rawDir = path.join(outputDir, 'raw');
    if (!fs.existsSync(rawDir)) {
      fs.mkdirSync(rawDir, { recursive: true });
    }
    fs.writeFileSync(path.join(rawDir, `${model}.json`), JSON.stringify(rawTimes, null, 2));
  }

  const runId = process.env.PERF_RUN_ID;
  if (!runId) {
    return;
  }

  const runDir = path.join(outputRoot, 'runs', runId, kind);
  if (!fs.existsSync(runDir)) {
    fs.mkdirSync(runDir, { recursive: true });
  }

  fs.writeFileSync(path.join(runDir, `${model}.json`), JSON.stringify(stats, null, 2));

  if (rawTimes) {
    const runRawDir = path.join(outputRoot, 'runs', runId, kind, 'raw');
    if (!fs.existsSync(runRawDir)) {
      fs.mkdirSync(runRawDir, { recursive: true });
    }
    fs.writeFileSync(path.join(runRawDir, `${model}.json`), JSON.stringify(rawTimes, null, 2));
  }

  const metadataPath = path.join(outputRoot, 'runs', runId, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    const metadata = {
      runId,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      hostname: process.env.COMPUTERNAME || 'unknown',
      warmup: 'none',
      notes: 'Generated from Jest performance tests',
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }
}
