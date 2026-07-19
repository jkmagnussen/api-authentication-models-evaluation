import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";
import { calculateStats } from "../utils";
import fs from "fs";

describe("JWT – Attack Performance Test", () => {
  const ITERATIONS = 1000;

  // Use an intentionally invalid / expired / forged token
  const invalidToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID.ATTACKTOKEN";

  beforeAll(async () => {
    await resetDatabase();
  });

  test(`JWT protected route under replay/invalid-token attack (${ITERATIONS} requests)`, async () => {
    const times: number[] = [];
    let errors = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      const res = await request(app)
        .get("/jwt/protected")
        .set("Authorization", `Bearer ${invalidToken}`);

      const end = performance.now();
      times.push(end - start);

      if (res.status !== 200) errors++;
    }

    const stats = calculateStats(times);

    // Add error rate to the stats object
    const attackStats = {
      ...stats,
      errorRate: errors / ITERATIONS,
    };

    // Ensure directory exists
    const outputDir = "docs/performance-results/attacks";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write results
    fs.writeFileSync(
      `${outputDir}/jwt.json`,
      JSON.stringify(attackStats, null, 2)
    );
  });
});
