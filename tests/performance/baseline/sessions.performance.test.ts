import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";
import { calculateStats, writePerformanceResult } from "../utils";
import { prisma } from "../../../src/db"; // adjust if your DB import differs

describe("Sessions – Performance Test", () => {
  const ITERATIONS = 1000;
  let sessionCookie: string;

  beforeAll(async () => {
    await resetDatabase();

    // Seed user directly (bypasses CSRF, cookies, middleware)
    await prisma.user.create({
      data: {
        email: "test@example.com",
        password: "password" // or hashed if your login expects hashing
      }
    });

    // Login to obtain a valid session cookie
    const res = await request(app)
      .post("/sessions/login")
      .send({ email: "test@example.com", password: "password" });

    const cookies = res.headers["set-cookie"];

    if (!cookies || cookies.length === 0) {
      throw new Error("No session cookie returned from /sessions/login");
    }

    sessionCookie = cookies[0];
  });

  test(`Session protected route ${ITERATIONS} requests`, async () => {
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      await request(app)
        .get("/sessions/protected")
        .set("Cookie", sessionCookie);

      const end = performance.now();
      times.push(end - start);
    }

    const stats = calculateStats(times);
    writePerformanceResult("baseline", "sessions", stats);
  });
});
