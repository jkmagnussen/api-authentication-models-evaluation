// ⭐ Mock FIRST — before importing prisma or the controller
jest.mock('../../../src/db', () => ({
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

import { authorize } from '../../../src/oauth/oauth.controller';
import { prisma } from '../../../src/db';

describe('authorize controller', () => {
  it('returns code for valid user', async () => {
    // ⭐ Mock user lookup
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'client-123',
      email: 'test@example.com',
      password: '$2b$10$hashedpasswordexample1234567890abcdefghi',
    });

    // ⭐ Mock OAuth client lookup — MUST be one of your real clients
    (prisma.oAuthClient.findUnique as jest.Mock).mockResolvedValue({
      id: 'client-123',
      name: 'Test Client',
      secret: 'basic-secret',
    });

    // ⭐ Mock authorization code creation
    (prisma.oAuthAuthorizationCode.create as jest.Mock).mockResolvedValue({
      code: 'auth-code',
      userId: 'user-123',
      clientId: 'client-basic',
      state: null,
      expiresAt: new Date(Date.now() + 60000),
      used: false,
    });

    const req: any = {
      body: {
        userId: 'user-123',
        clientId: 'client-basic', // ✔ must match mock + real system
        scope: 'read', // ✔ allowed for client-basic
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
