import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/db";
import { resetDatabase } from "../setup";

function getCookieValue(cookieHeader: string | string[] | undefined, name: string) {
  if (!cookieHeader) return undefined;
  const header = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
  const match = header.match(new RegExp(`(^|; )${name}=([^;]+)`));
  return match ? match[2] : undefined;
}

describe("Auth security regression tests", () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "test@example.com",
        password: "password",
      },
    });
  });

  test("login endpoints are rate-limited after repeated attempts", async () => {
    const results = [] as Array<{ status: number }>;

    for (let i = 0; i < 6; i += 1) {
      const res = await request(app)
        .post("/jwt/login")
        .send({ email: "test@example.com", password: "password" });
      results.push({ status: res.status });
    }

    expect(results.some((result) => result.status === 429)).toBe(true);
  });

  test("logging in invalidates a previously issued session cookie", async () => {
    const firstLogin = await request(app)
      .post("/sessions/login")
      .send({ email: "test@example.com", password: "password" });

    const firstCookieHeader = firstLogin.headers["set-cookie"];
    const firstSessionId = getCookieValue(firstCookieHeader, "sessionId");
    expect(firstSessionId).toBeDefined();

    const secondLogin = await request(app)
      .post("/sessions/login")
      .set("Cookie", `sessionId=${firstSessionId}`)
      .send({ email: "test@example.com", password: "password" });

    const secondCookieHeader = secondLogin.headers["set-cookie"];
    const secondSessionId = getCookieValue(secondCookieHeader, "sessionId");
    expect(secondSessionId).toBeDefined();
    expect(secondSessionId).not.toBe(firstSessionId);

    const oldSession = await prisma.session.findUnique({ where: { id: firstSessionId! } });
    expect(oldSession).toBeNull();
  });

  test("refresh tokens are rotated and cannot be reused", async () => {
    const authorizeRes = await request(app)
      .post("/oauth/authorize")
      .send({ userId: "123e4567-e89b-12d3-a456-426614174000", clientId: "client-basic" });

    const code = authorizeRes.body.code;

    const tokenRes = await request(app)
      .post("/oauth/token")
      .send({ code });

    const refreshToken = tokenRes.body.refresh_token;

    const firstRefresh = await request(app)
      .post("/oauth/refresh")
      .send({ refreshToken: refreshToken, clientId: "client-basic" });

    expect(firstRefresh.status).toBe(200);

    const replayRefresh = await request(app)
      .post("/oauth/refresh")
      .send({ refreshToken: refreshToken, clientId: "client-basic" });

    expect(replayRefresh.status).toBe(400);
    expect(replayRefresh.body.error).toBe("invalid_grant");
  });
});
