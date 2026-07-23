import jwt from "jsonwebtoken";
import request from "supertest";
import { loadVariantApp } from "../load-variant-app";
import { resetDatabase } from "../../setup";
import { prisma } from "../../../src/db";

const app = loadVariantApp();

describe("JWT expiry misconfiguration exploit", () => {
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

  it("issues a token with an excessively long lifetime", async () => {
    const loginRes = await request(app)
      .post("/jwt/login")
      .send({ email: "test@example.com", password: "password" });

    expect(loginRes.status).toBe(200);

    const decoded = jwt.decode(loginRes.body.token) as jwt.JwtPayload;
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();

    const lifetimeSeconds = (decoded.exp as number) - (decoded.iat as number);
    expect(lifetimeSeconds).toBeGreaterThan(60 * 60 * 24 * 7);
  });
});
