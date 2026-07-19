import { token } from "../../../src/oauth/oauth.controller";
import { prisma } from "../../../src/db";
import * as oauthService from "../../../src/oauth/oauth.service";

// Mock ONLY the Prisma + service calls used by the controller
jest.mock("../../../src/db", () => ({
  prisma: {
    oAuthAuthorizationCode: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    oAuthClient: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../../src/oauth/oauth.service", () => ({
  __esModule: true,
  exchangeCodeForToken: jest.fn(),
}));

describe("token controller", () => {
  it("returns access token for valid code", async () => {
    // Mock lookup of authorization code
    (prisma.oAuthAuthorizationCode.findUnique as jest.Mock).mockResolvedValue({
      code: "auth-code",
      userId: "user-123",
      clientId: "client-123",
      expiresAt: new Date(Date.now() + 60000),
      used: false,
    });

    // Mock marking the code as used
    (prisma.oAuthAuthorizationCode.update as jest.Mock).mockResolvedValue({
      code: "auth-code",
      used: true,
    });

    // Mock OAuth client lookup
    (prisma.oAuthClient.findUnique as jest.Mock).mockResolvedValue({
      id: "client-123",
      name: "Test Client",
      secret: "test-secret",
    });

    // Mock token generation
    (oauthService.exchangeCodeForToken as jest.Mock).mockResolvedValue({
      accessToken: "jwt-token",
      refreshToken: "refresh-token",
      scope: "read",
    });

    const basicAuth = Buffer.from("client-123:test-secret").toString("base64");

    const req: any = {
      body: { code: "auth-code" },
      headers: { authorization: `Basic ${basicAuth}` },   // ⭐ FIXED
    };

    const res: any = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await token(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      access_token: "jwt-token",
      accessToken: "jwt-token",
      refresh_token: "refresh-token",
      refreshToken: "refresh-token",
      token_type: "Bearer",
      expires_in: 3600,
    });
  });
});
