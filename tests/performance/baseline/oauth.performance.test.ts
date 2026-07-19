import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";
import { calculateStats } from "../utils";
import fs from "fs";

describe("OAuth – Performance Test", () => {
  const ITERATIONS = 1000;
  let authCode: string;

  beforeAll(async () => {
    await resetDatabase();

    // Step 1: Get an authorization code
    const authorizeRes = await request(app)
      .post("/oauth/authorize")
      .send({
        client_id: "clientA",
        redirect_uri: "http://localhost/callback",
        email: "test@example.com",
        password: "password"
      });

    authCode = authorizeRes.body.code;
  });

  test(`OAuth token exchange ${ITERATIONS} requests`, async () => {
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      await request(app)
        .post("/oauth/token")
        .send({
          code: authCode,
          client_id: "clientA",
          redirect_uri: "http://localhost/callback"
        });

      const end = performance.now();
      times.push(end - start);
    }

    const stats = calculateStats(times);

    // Ensure directory exists
    const outputDir = "docs/performance-results/baseline";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write baseline OAuth performance results
    fs.writeFileSync(
      `${outputDir}/oauth.json`,
      JSON.stringify(stats, null, 2)
    );
  });
});
