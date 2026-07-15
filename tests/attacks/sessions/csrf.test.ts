import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";

describe("Sessions – CSRF Attack Test", () => {
  let sessionCookie: string;

  beforeAll(async () => {
    await resetDatabase();

    const res = await request(app)
      .post("/sessions/login")
      .send({ email: "test@example.com", password: "password" });

    // sessionId cookie from login
    sessionCookie = res.headers["set-cookie"][0]; // e.g. "sessionId=..."
  });

  test("Request with valid CSRF token should succeed", async () => {
    // 1. Get CSRF token + CSRF cookie
    const csrfRes = await request(app)
      .get("/sessions/csrf-token")
      .set("Cookie", sessionCookie);

    const validToken = csrfRes.body.csrfToken;
    const csrfCookie = csrfRes.headers["set-cookie"][0]; // e.g. "_csrf=..."

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
