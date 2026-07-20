import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import { resetDatabase } from "../../setup";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

describe("Error-message consistency", () => {
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

  it("returns the same JWT login error for unknown user and wrong password", async () => {
    const unknownUser = await request(app)
      .post("/jwt/login")
      .send({ email: "nobody@example.com", password: "password" });

    const wrongPassword = await request(app)
      .post("/jwt/login")
      .send({ email: "test@example.com", password: "wrong-password" });

    expect(unknownUser.status).toBe(wrongPassword.status);
    expect(unknownUser.body).toEqual(wrongPassword.body);
    expect(unknownUser.body.error).toBe("Invalid credentials");
  });

  it("returns a stable error for invalid and expired OAuth authorization codes", async () => {
    const invalid = await request(app)
      .post("/oauth/token")
      .send({ code: "not-a-real-code" });

    await prisma.oAuthAuthorizationCode.create({
      data: {
        code: "expired-code",
        userId: validUUID,
        clientId: "client-basic",
        expiresAt: new Date(Date.now() - 10_000),
        used: false,
      },
    });

    const expired = await request(app)
      .post("/oauth/token")
      .send({ code: "expired-code" });

    expect(invalid.status).toBe(400);
    expect(expired.status).toBe(400);
    expect(invalid.body.error).toBe("Invalid authorization code");
    expect(expired.body.error).toBe("Invalid authorization code");
  });
});
