import { token } from "../../../src/oauth/oauth.controller";
import { prisma } from "../../../src/db";
import * as oauthService from "../../../src/oauth/oauth.service";

jest.mock("../../../src/db", () => ({
  prisma: {
    oAuthAuthorizationCode: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../../src/oauth/oauth.service", () => ({
  __esModule: true,
  exchangeCodeForToken: jest.fn(),
}));

describe("token controller", () => {
  it("returns access token for valid code", async () => {
    (prisma.oAuthAuthorizationCode.findUnique as jest.Mock).mockResolvedValue({
      code: "auth-code",
      userId: "user-123",
      expiresAt: new Date(Date.now() + 60000),
      used: false,
    });

    // ⭐ MUST match controller: controller expects token.token
    (oauthService.exchangeCodeForToken as jest.Mock).mockResolvedValue({
      token: "jwt-token",
    });

    const req: any = { body: { code: "auth-code" } };
    const res: any = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await token(req, res);

    expect(res.json).toHaveBeenCalledWith({
      access_token: "jwt-token",
      token_type: "Bearer",
      expires_in: 3600,
    });
  });
});
