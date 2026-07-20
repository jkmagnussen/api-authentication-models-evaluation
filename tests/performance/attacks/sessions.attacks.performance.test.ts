import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";
import { calculateStats, writePerformanceResult } from "../utils";

describe("Sessions – Attack Performance Test", () => {
  const ITERATIONS = 1000;

  // Intentionally invalid / expired / forged session cookie
  const invalidSessionCookie = "session=INVALID_ATTACK_COOKIE";

  beforeAll(async () => {
    await resetDatabase();
  });

  test(`Session protected route under expired/stolen cookie replay attack (${ITERATIONS} requests)`, async () => {
    const times: number[] = [];
    let errors = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      const res = await request(app)
        .get("/sessions/protected")
        .set("Cookie", invalidSessionCookie);

      const end = performance.now();
      times.push(end - start);

      if (res.status !== 200) errors++;
    }

    const stats = calculateStats(times);

    const attackStats = {
      ...stats,
      errorRate: errors / ITERATIONS,
    };

    writePerformanceResult("attacks", "sessions", attackStats);
  });
});
