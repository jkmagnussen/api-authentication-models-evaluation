import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";
import { prisma } from "../../../src/db";

describe("Sessions – Replay Attack Test", () => {
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

    // Login → get a valid session cookie
    const res = await request(app)
      .post("/sessions/login")
      .send({ email: "test@example.com", password: "password" });

    cookie = res.headers["set-cookie"][0];
  });

  test("Reusing the same session cookie should still succeed until session expiry", async () => {
    // First use — should succeed
    const firstRes = await request(app)
      .get("/sessions/protected")
      .set("Cookie", cookie);

    expect(firstRes.status).toBe(200);

    // Replay the exact same cookie — should also succeed
    const replayRes = await request(app)
      .get("/sessions/protected")
      .set("Cookie", cookie);

    expect(replayRes.status).toBe(200);
  });

  test("Replayed cookie after logout should fail", async () => {
    // Logout → server deletes the session record
    await request(app)
      .post("/sessions/logout")
      .set("Cookie", cookie);

    // Replay the same cookie → should now fail
    const res = await request(app)
      .get("/sessions/protected")
      .set("Cookie", cookie);

    expect(res.status).toBe(401);
  });
});
