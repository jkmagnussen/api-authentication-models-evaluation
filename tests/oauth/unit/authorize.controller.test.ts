// ⭐ Mock FIRST — before importing prisma or the controller
jest.mock("../../../src/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    oAuthClient: {
      findUnique: jest.fn(),
    },
    oAuthAuthorizationCode: {
      create: jest.fn(),
    },
  },
}));

import { authorize } from "../../../src/oauth/oauth.controller";
import { prisma } from "../../../src/db";

describe("authorize controller", () => {
  it("returns code for valid user", async () => {
    // ⭐ Mock user lookup — hashed password is irrelevant here
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      password: "$2b$10$hashedpasswordexample1234567890abcdefghi", // Option B
    });

    // ⭐ Mock OAuth client lookup
    (prisma.oAuthClient.findUnique as jest.Mock).mockResolvedValue({
      id: "client-123",
      name: "Test Client",
      secret: "test-secret",
    });

    // ⭐ Mock authorization code creation
    (prisma.oAuthAuthorizationCode.create as jest.Mock).mockResolvedValue({
      code: "auth-code",
      userId: "user-123",
      clientId: "client-123",
      state: null,
      expiresAt: new Date(Date.now() + 60000),
      used: false,
    });

    const req: any = {
      body: {
        userId: "user-123",
        clientId: "client-123", // ⭐ must match your controller
      },
    };

    const res: any = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await authorize(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      code: expect.any(String),
      state: null,
    });
  });
});
