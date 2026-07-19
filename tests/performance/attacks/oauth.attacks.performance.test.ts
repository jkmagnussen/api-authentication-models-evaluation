import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";
import { calculateStats } from "../utils";
import fs from "fs";

describe("OAuth – Attack Performance Test", () => {
  const ITERATIONS = 1000;

  // Intentionally invalid / replayed authorization code
  const invalidCode = "REPLAYED_OR_INVALID_CODE";

  beforeAll(async () => {
    await resetDatabase();
  });

  test(`OAuth token endpoint under invalid/replayed code attack (${ITERATIONS} requests)`, async () => {
    const times: number[] = [];
    let errors = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      const res = await request(app)
        .post("/oauth/token")
        .send({
          code: invalidCode,
          client_id: "clientA",
          redirect_uri: "http://localhost/callback"
        });

      const end = performance.now();
      times.push(end - start);

      if (res.status !== 200) errors++;
    }

    const stats = calculateStats(times);

    const attackStats = {
      ...stats,
      errorRate: errors / ITERATIONS,
    };

    // Ensure directory exists
    const outputDir = "docs/performance-results/attacks";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      `${outputDir}/oauth.json`,
      JSON.stringify(attackStats, null, 2)
    );
  });
});