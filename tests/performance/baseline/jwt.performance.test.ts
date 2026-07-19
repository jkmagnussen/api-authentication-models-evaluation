import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";
import { calculateStats } from "../utils";
import fs from "fs";

describe("JWT – Performance Test", () => {
  const ITERATIONS = 1000;
  let token: string;

  beforeAll(async () => {
    await resetDatabase();

    const res = await request(app)
      .post("/jwt/login")
      .send({ email: "test@example.com", password: "password" });

    token = res.body.token;
  });

  test(`JWT protected route ${ITERATIONS} requests`, async () => {
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      await request(app)
        .get("/jwt/protected")
        .set("Authorization", `Bearer ${token}`);

      const end = performance.now();
      times.push(end - start);
    }

    const stats = calculateStats(times);

    const outputDir = "docs/performance-results/baseline";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(`${outputDir}/jwt.json`, JSON.stringify(stats, null, 2));
  });
});
