import fs from "fs";

describe("Performance Summary", () => {
  test("Combined results", () => {
    const jwt = JSON.parse(fs.readFileSync("docs/performance-results/baseline/jwt.json", "utf8"));
    const oauth = JSON.parse(fs.readFileSync("docs/performance-results/baseline/oauth.json", "utf8"));
    const sessions = JSON.parse(fs.readFileSync("docs/performance-results/baseline/sessions.json", "utf8"));

    const jwtAttack = JSON.parse(
      fs.readFileSync("docs/performance-results/attacks/jwt.json", "utf8")
    );
    const oauthAttack = JSON.parse(
      fs.readFileSync("docs/performance-results/attacks/oauth.json", "utf8")
    );
    const sessionsAttack = JSON.parse(
      fs.readFileSync("docs/performance-results/attacks/sessions.json", "utf8")
    );

    console.log(`
==================== PERFORMANCE SUMMARY ====================

Baseline:
JWT      → avg: ${jwt.avg.toFixed(4)}ms | p95: ${jwt.p95.toFixed(4)}ms | p99: ${jwt.p99.toFixed(4)}ms | thr: ${jwt.throughput.toFixed(2)} req/s
Sessions → avg: ${sessions.avg.toFixed(4)}ms | p95: ${sessions.p95.toFixed(4)}ms | p99: ${sessions.p99.toFixed(4)}ms | thr: ${sessions.throughput.toFixed(2)} req/s
OAuth    → avg: ${oauth.avg.toFixed(4)}ms | p95: ${oauth.p95.toFixed(4)}ms | p99: ${oauth.p99.toFixed(4)}ms | thr: ${oauth.throughput.toFixed(2)} req/s

Under Attack:
JWT      → avg: ${jwtAttack.avg.toFixed(4)}ms | p95: ${jwtAttack.p95.toFixed(4)}ms | p99: ${jwtAttack.p99.toFixed(4)}ms | thr: ${jwtAttack.throughput.toFixed(2)} req/s
Sessions → avg: ${sessionsAttack.avg.toFixed(4)}ms | p95: ${sessionsAttack.p95.toFixed(4)}ms | p99: ${sessionsAttack.p99.toFixed(4)}ms | thr: ${sessionsAttack.throughput.toFixed(2)} req/s
OAuth    → avg: ${oauthAttack.avg.toFixed(4)}ms | p95: ${oauthAttack.p95.toFixed(4)}ms | p99: ${oauthAttack.p99.toFixed(4)}ms | thr: ${oauthAttack.throughput.toFixed(2)} req/s

==============================================================
`);
  });
});