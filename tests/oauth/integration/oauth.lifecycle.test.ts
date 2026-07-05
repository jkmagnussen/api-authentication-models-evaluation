import request from "supertest";
import app from "../../../src/app";
import { prisma } from "../../../src/db";
import {
  exchangeCodeForToken,
  validateAccessToken,
  createAuthorizationCode
} from "../../../src/oauth/oauth.service";

const validUUID = "123e4567-e89b-12d3-a456-426614174000";

jest.mock("../../../src/db", () => ({
  prisma: {
    authorizationCode: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../../src/oauth/oauth.service", () => ({
  createAuthorizationCode: jest.fn(),
  exchangeCodeForToken: jest.fn(),
  validateAccessToken: jest.fn(),
}));

describe("OAuth Lifecycle Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------
  // EXPIRED AUTHORIZATION CODE
  // ---------------------------

  it("POST /oauth/token → rejects expired authorization code", async () => {
    // Mock DB returning an expired code
    (prisma.authorizationCode.findUnique as jest.Mock).mockResolvedValue({
      code: "expired-code-123",
      userId: validUUID,
      expiresAt: new Date(Date.now() - 10000), // 10 seconds in the past
      used: false,
    });

    // exchangeCodeForToken should return null for expired codes
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
    // Mock DB returning a code that has already been used
    (prisma.authorizationCode.findUnique as jest.Mock).mockResolvedValue({
      code: "used-code-123",
      userId: validUUID,
      expiresAt: new Date(Date.now() + 60000), // still valid
      used: true, // already used
    });

    // exchangeCodeForToken should return null for reused codes
    (exchangeCodeForToken as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/oauth/token")
      .send({ code: "used-code-123" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid authorization code" });
  });
});
