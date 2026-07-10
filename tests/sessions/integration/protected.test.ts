import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";

describe("Session Authentication – Protected Route", () => {

  beforeEach(async () => {
    await resetDatabase();
  });

  test("Protected route returns 200 for valid session and 401 for invalid", async () => {
    await prisma.session.create({
      data: {
        id: "valid-session",
        userId: "user-123",
        expiresAt: new Date(Date.now() + 60_000)
      }
    });

    const ok = await request(app)
      .get("/sessions/protected")
      .set("Cookie", "sessionId=valid-session");

    expect(ok.status).toBe(200);
    expect(ok.body.userId).toBe("user-123");

    const bad = await request(app)
      .get("/sessions/protected")
      .set("Cookie", "sessionId=does-not-exist");

    expect(bad.status).toBe(401);
    expect(bad.body.message).toBe("Invalid session");
  });
});