import request from "supertest";
import app from "../../../src/app";
import { resetDatabase } from "../../setup";
import { prisma } from "../../../src/db";

jest.mock("../../../src/db", () => ({
  prisma: {
    session: {
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    oAuthAuthorizationCode: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("OAuth – Redirect URI Manipulation Attack", () => {

  beforeEach(async () => {
    await resetDatabase();
    jest.clearAllMocks();

    // Mock user lookup
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
    });

    // Mock authorization code creation
    (prisma.oAuthAuthorizationCode.create as jest.Mock).mockResolvedValue({
      code: "redirect-test-code",
      userId: "11111111-1111-1111-1111-111111111111",
      clientId: "client-123",
      redirectUri: "https://evil.com/callback",
      expiresAt: new Date(Date.now() + 60000),
      used: false,
    });
  });

  test("Unregistered redirect URI should be rejected", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: "11111111-1111-1111-1111-111111111111",
        client_id: "client-123",
        redirect_uri: "https://evil.com/callback",
        response_type: "code",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid redirect URI");
  });
});
