import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("Session fixation", () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: validUUID,
        email: "test@example.com",
        password: "password",
      },
    });
  });

  it("rejects a pre-login fixed session id and issues a fresh one", async () => {
    const fixedId = "attacker-fixed-session-id";

    const loginRes = await request(app)
      .post("/sessions/login")
      .set("Cookie", `sessionId=${fixedId}`)
      .send({ email: "test@example.com", password: "password" });

    expect(loginRes.status).toBe(200);

    const cookieHeader = loginRes.headers["set-cookie"];
    const sessionCookie = Array.isArray(cookieHeader) ? cookieHeader[0] : "";

    expect(sessionCookie).toContain("sessionId=");
    expect(sessionCookie).not.toContain(`sessionId=${fixedId}`);

    const stolen = await prisma.session.findUnique({ where: { id: fixedId } });
    expect(stolen).toBeNull();
  });

  it("invalidates the old session after re-login", async () => {
    const first = await request(app)
      .post("/sessions/login")
      .send({ email: "test@example.com", password: "password" });

    const firstCookieHeader = first.headers["set-cookie"];
    const firstCookie = Array.isArray(firstCookieHeader) ? firstCookieHeader[0] : "";

    const second = await request(app)
      .post("/sessions/login")
      .set("Cookie", firstCookie)
      .send({ email: "test@example.com", password: "password" });

    expect(second.status).toBe(200);

    const match = /sessionId=([^;]+)/.exec(firstCookie);
    const oldId = match?.[1];
    expect(oldId).toBeDefined();

    const oldSession = await prisma.session.findUnique({ where: { id: oldId! } });
    expect(oldSession).toBeNull();
  });
});
