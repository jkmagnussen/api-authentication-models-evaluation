import fs from "fs";

describe("Performance Summary", () => {
  test("Combined results", () => {
    const jwt = JSON.parse(fs.readFileSync("jwt-performance.json", "utf8"));
    const oauth = JSON.parse(fs.readFileSync("oauth-performance.json", "utf8"));
    const sessions = JSON.parse(fs.readFileSync("sessions-performance.json", "utf8"));

    console.log(`
==================== PERFORMANCE SUMMARY ====================

JWT      → avg: ${jwt.avg.toFixed(4)}ms | p95: ${jwt.p95.toFixed(4)}ms | p99: ${jwt.p99.toFixed(4)}ms | thr: ${jwt.throughput.toFixed(2)} req/s
Sessions → avg: ${sessions.avg.toFixed(4)}ms | p95: ${sessions.p95.toFixed(4)}ms | p99: ${sessions.p99.toFixed(4)}ms | thr: ${sessions.throughput.toFixed(2)} req/s
OAuth    → avg: ${oauth.avg.toFixed(4)}ms | p95: ${oauth.p95.toFixed(4)}ms | p99: ${oauth.p99.toFixed(4)}ms | thr: ${oauth.throughput.toFixed(2)} req/s

==============================================================
`);
  });
});