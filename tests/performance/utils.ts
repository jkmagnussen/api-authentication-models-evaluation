export function calculateStats(times: number[]) {
  times.sort((a, b) => a - b);

  const total = times.reduce((a, b) => a + b, 0);
  const avg = total / times.length;

  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];

  const throughput = 1000 / avg; // requests per second

  return { avg, p95, p99, throughput };
}