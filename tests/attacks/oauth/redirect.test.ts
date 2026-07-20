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
    oAuthClient: {
      findUnique: jest.fn(),
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

    (prisma.oAuthClient.findUnique as jest.Mock).mockResolvedValue({
      id: "client-basic",
      name: "Basic Client",
      secret: "basic-secret",
    });

    // Mock authorization code creation
    (prisma.oAuthAuthorizationCode.create as jest.Mock).mockResolvedValue({
      code: "redirect-test-code",
      userId: "11111111-1111-1111-1111-111111111111",
      clientId: "client-basic",
      expiresAt: new Date(Date.now() + 60000),
      used: false,
    });
  });

  test("Unregistered redirect URI should be rejected", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: "11111111-1111-1111-1111-111111111111",
        clientId: "client-basic",
        redirectUri: "https://evil.example/callback"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid redirect URI");
  });

  test("Encoded redirect URI variants should also be rejected", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: "11111111-1111-1111-1111-111111111111",
        clientId: "client-basic",
        redirectUri: "https://example.com/callback%2Fextra"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid redirect URI");
  });

  test("Redirect URI parameter pollution should be rejected", async () => {
    const res = await request(app)
      .post("/oauth/authorize")
      .send({
        userId: "11111111-1111-1111-1111-111111111111",
        clientId: "client-basic",
        redirectUri: "https://example.com/callback",
        redirect_uri: "https://evil.example/callback"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid redirect URI");
  });
});
