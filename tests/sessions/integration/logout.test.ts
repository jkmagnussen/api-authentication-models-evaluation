import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";

describe("Session Authentication – Logout", () => {

  beforeEach(async () => {
    await resetDatabase();
  });

  test("Logout deletes session and protected route returns 401", async () => {
    await prisma.session.create({
      data: {
        id: "valid-session",
        userId: "user-123",
        expiresAt: new Date(Date.now() + 60_000)
      }
    });

    await request(app)
      .post("/sessions/logout")
      .set("Cookie", "sessionId=valid-session");

    const res = await request(app)
      .get("/sessions/protected")
      .set("Cookie", "sessionId=valid-session");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid session");
  });
});