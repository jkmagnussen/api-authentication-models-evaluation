import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { generateCurrentTotp } from "../../../src/auth/totp";
import { resetDatabase } from "../../setup";

describe("Cross-cutting auth security", () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: "user-123",
        email: "test@example.com",
        password: "password123",
      },
    });
  });

  test("password reset request and confirm updates the login password", async () => {
    const requestRes = await request(app)
      .post("/auth/security/password-reset/request")
      .send({ email: "test@example.com" });

    expect(requestRes.status).toBe(202);
    expect(requestRes.body.reset_token).toBeDefined();

    const confirmRes = await request(app)
      .post("/auth/security/password-reset/confirm")
      .send({ token: requestRes.body.reset_token, newPassword: "password456" });

    expect(confirmRes.status).toBe(200);

    const loginRes = await request(app)
      .post("/jwt/login")
      .send({ email: "test@example.com", password: "password456" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });

  test("mfa enrollment and verification enable MFA", async () => {
    const enrollRes = await request(app)
      .post("/auth/security/mfa/enroll")
      .send({ email: "test@example.com", password: "password123" });

    expect(enrollRes.status).toBe(200);
    expect(enrollRes.body.secret).toBeDefined();

    const verifyRes = await request(app)
      .post("/auth/security/mfa/verify")
      .send({ email: "test@example.com", code: generateCurrentTotp(enrollRes.body.secret) });

    expect(verifyRes.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { id: "user-123" } });
    expect(user?.mfaEnabled).toBe(true);
  });

  test("jwt login requires MFA once enabled", async () => {
    const enrollRes = await request(app)
      .post("/auth/security/mfa/enroll")
      .send({ email: "test@example.com", password: "password123" });

    await request(app)
      .post("/auth/security/mfa/verify")
      .send({ email: "test@example.com", code: generateCurrentTotp(enrollRes.body.secret) });

    const jwtWithoutMfa = await request(app)
      .post("/jwt/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(jwtWithoutMfa.status).toBe(401);

    const jwtWithMfa = await request(app)
      .post("/jwt/login")
      .send({ email: "test@example.com", password: "password123", mfaCode: generateCurrentTotp(enrollRes.body.secret) });

    expect(jwtWithMfa.status).toBe(200);
  });

  test("session login requires MFA once enabled", async () => {
    const enrollRes = await request(app)
      .post("/auth/security/mfa/enroll")
      .send({ email: "test@example.com", password: "password123" });

    await request(app)
      .post("/auth/security/mfa/verify")
      .send({ email: "test@example.com", code: generateCurrentTotp(enrollRes.body.secret) });

    const sessionWithoutMfa = await request(app)
      .post("/sessions/login")
      .send({ email: "test@example.com", password: "password123" });

    expect(sessionWithoutMfa.status).toBe(401);

    const sessionWithMfa = await request(app)
      .post("/sessions/login")
      .send({ email: "test@example.com", password: "password123", mfaCode: generateCurrentTotp(enrollRes.body.secret) });

    expect(sessionWithMfa.status).toBe(200);
  });
});