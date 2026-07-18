import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";
import { prisma } from "../../../src/db";

describe("Sessions – CSRF Attack Test", () => {
  let sessionCookie: string;

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

    // sessionId cookie from login
    const cookieHeader = res.headers["set-cookie"];
    sessionCookie = Array.isArray(cookieHeader) ? cookieHeader[0] : "";
  });

  test("Request with valid CSRF token should succeed", async () => {
    // 1. Get CSRF token + CSRF cookie
    const csrfRes = await request(app)
      .get("/sessions/csrf-token")
      .set("Cookie", sessionCookie);

    const validToken = csrfRes.body.csrfToken;
    const csrfCookieHeader = csrfRes.headers["set-cookie"];
    const csrfCookie = Array.isArray(csrfCookieHeader) ? csrfCookieHeader[0] : "";

    // 2. Combine both cookies: sessionId + _csrf
    const combinedCookies = `${sessionCookie}; ${csrfCookie}`;

    const res = await request(app)
      .post("/sessions/protected-action")
      .set("Cookie", combinedCookies)
      .set("csrf-token", validToken) // header name csurf accepts
      .send({ action: "transfer-money" });

    expect(res.status).toBe(200);
  });
});
