import request from "supertest";
import app from "../../src/app";
import { resetDatabase } from "../setup";
import { calculateStats } from "./utils";
import fs from "fs";

describe("OAuth – Performance Test", () => {
  const ITERATIONS = 300; // OAuth is slower
  let accessToken: string;

  beforeAll(async () => {
    await resetDatabase();

    // Step 1: Authorize → get code
    const authRes = await request(app)
      .post("/oauth/authorize")
      .send({ email: "test@example.com", password: "password" });

    const code = authRes.body.code;

    // Step 2: Exchange code → get access token
    const tokenRes = await request(app)
      .post("/oauth/token")
      .send({ code });

    accessToken = tokenRes.body.accessToken;
  });

  test(`OAuth protected route ${ITERATIONS} requests`, async () => {
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      await request(app)
        .get("/oauth/protected")
        .set("Authorization", `Bearer ${accessToken}`);

      const end = performance.now();
      times.push(end - start);
    }

    const stats = calculateStats(times);

    fs.writeFileSync("oauth-performance.json", JSON.stringify(stats, null, 2));
  });
});