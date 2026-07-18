import request from "supertest";
import app from "../../src/app";
import { resetDatabase } from "../setup";
import { calculateStats } from "./utils";
import fs from "fs";
import { prisma } from "../../src/db";

describe("Sessions – Performance Test", () => {
  const ITERATIONS = 1000;
  let cookie: string;

  beforeAll(async () => {
    await resetDatabase();

    await prisma.user.create({
    data: {
      id: "user-123",
      email: "test@example.com",
      password: "password"
    }
  });

    const res = await request(app)
      .post("/sessions/login")
      .send({ email: "test@example.com", password: "password" });

    cookie = res.headers["set-cookie"][0];
  });

  test(`Sessions protected route ${ITERATIONS} requests`, async () => {
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      await request(app)
        .get("/sessions/protected")
        .set("Cookie", cookie);

      const end = performance.now();
      times.push(end - start);
    }

    const stats = calculateStats(times);

    fs.writeFileSync("sessions-performance.json", JSON.stringify(stats, null, 2));
  });
});
