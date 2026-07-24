import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";   // ⭐ Use global reset
import { prisma } from "../../../src/db";
import {
  exchangeCodeForToken
} from "../../../src/oauth/oauth.service";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

jest.mock("../../../src/oauth/oauth.service", () => ({
  exchangeCodeForToken: jest.fn(),
  validateAccessToken: jest.fn(),
}));

describe("OAuth Lifecycle Tests", () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // ⭐ Use global DB reset (correct FK order + OAuth client recreated)
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: validUUID,
        email: "test@example.com",
        password: "hashed-password",
      },
    });
  });

  // ---------------------------
  // EXPIRED AUTHORIZATION CODE
  // ---------------------------

  it("POST /oauth/token → rejects expired authorization code", async () => {
    // ⭐ Insert expired code (only valid fields)
    await prisma.oAuthAuthorizationCode.create({
      data: {
        code: "expired-code-123",
        userId: validUUID,
        expiresAt: new Date(Date.now() - 10000), // expired
        used: false,
        clientId: "client-123"
      },
    });

    // Force service to return null (invalid)
    (exchangeCodeForToken as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/oauth/token")
      .send({ code: "expired-code-123" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid authorization code" });
  });

  // ---------------------------
  // REUSED AUTHORIZATION CODE
  // ---------------------------

  it("POST /oauth/token → rejects reused authorization code", async () => {
    // ⭐ Insert USED code (only valid fields)
    await prisma.oAuthAuthorizationCode.create({
      data: {
        code: "used-code-123",
        userId: validUUID,
        expiresAt: new Date(Date.now() + 60000), // still valid
        used: true, // already used
        clientId: "client-123"
      },
    });

    // Force service to return null (invalid)
    (exchangeCodeForToken as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/oauth/token")
      .send({ code: "used-code-123" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Authorization code already used" });
  });
});
