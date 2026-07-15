import { authorize } from "../../../src/oauth/oauth.controller";
import { prisma } from "../../../src/db";
import * as oauthService from "../../../src/oauth/oauth.service";

jest.mock("../../../src/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    oAuthAuthorizationCode: {
      create: jest.fn(),
    },
  },
}));

jest.mock("../../../src/oauth/oauth.service", () => ({
  __esModule: true,
  createAuthorizationCode: jest.fn(),
}));

describe("authorize controller", () => {
  it("returns code for valid user", async () => {
    // Mock user lookup
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-123",
    });

    // Mock service-generated code (controller ignores this and generates its own UUID)
    (oauthService.createAuthorizationCode as jest.Mock).mockResolvedValue("auth-code");

    // Mock Prisma create
    (prisma.oAuthAuthorizationCode.create as jest.Mock).mockResolvedValue({
      code: "auth-code",
      userId: "user-123",
      clientId: "client-123",
      redirectUri: "https://example.com/callback",
      expiresAt: new Date(Date.now() + 60000),
      used: false,
    });

    const req: any = {
      body: {
        userId: "user-123",
        client_id: "client-123",
        redirect_uri: "https://example.com/callback",
      },
    };

    const res: any = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await authorize(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    // Controller ALWAYS generates a UUID → accept any string
    expect(res.json).toHaveBeenCalledWith({
      code: expect.any(String),
    });
  });
});
