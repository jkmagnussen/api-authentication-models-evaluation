import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";

describe("Session Authentication – Expiry", () => {

  beforeEach(async () => {
  await resetDatabase();

  await prisma.user.create({
    data: {
      id: "user-123",
      email: "test@example.com",
      password: "password"
    }
  });
});

  test("Expired session returns 401", async () => {
    await prisma.session.create({
      data: {
        id: "expired-session",
        userId: "user-123",
        expiresAt: new Date(Date.now() - 60_000) // expired 1 minute ago
      }
    });

    const res = await request(app)
      .get("/sessions/protected")
      .set("Cookie", "sessionId=expired-session");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Session expired");
  });
});
