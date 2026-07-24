import fs from 'fs';

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
  stats: Record<string, number>
) {
  const outputDir = `docs/performance-results/${kind}`;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(`${outputDir}/${model}.json`, JSON.stringify(stats, null, 2));

  const runId = process.env.PERF_RUN_ID;
  if (!runId) {
    return;
  }

  const runDir = `docs/performance-results/runs/${runId}/${kind}`;
  if (!fs.existsSync(runDir)) {
    fs.mkdirSync(runDir, { recursive: true });
  }

  fs.writeFileSync(`${runDir}/${model}.json`, JSON.stringify(stats, null, 2));

  const metadataPath = `docs/performance-results/runs/${runId}/metadata.json`;
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
