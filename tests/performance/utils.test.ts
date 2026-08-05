import fs from 'fs';
import os from 'os';
import path from 'path';
import { writePerformanceResult } from './utils';

describe('writePerformanceResult', () => {
  it('writes raw timing traces alongside the summary stats', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-output-'));
    const outputRoot = path.join(tempRoot, 'docs', 'performance-results');

    writePerformanceResult(
      'baseline',
      'jwt',
      { avg: 1.2, p95: 2.3, p99: 3.4, throughput: 833.3 },
      [0.1, 0.2, 0.3],
      outputRoot
    );

    const summaryPath = path.join(outputRoot, 'baseline', 'jwt.json');
    const rawPath = path.join(outputRoot, 'baseline', 'raw', 'jwt.json');

    expect(fs.existsSync(summaryPath)).toBe(true);
    expect(fs.existsSync(rawPath)).toBe(true);

    const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    expect(rawData).toEqual([0.1, 0.2, 0.3]);

    fs.rmSync(tempRoot, { recursive: true, force: true });
  });
});
