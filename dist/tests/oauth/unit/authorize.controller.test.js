"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const oauth_controller_1 = require("../../../src/oauth/oauth.controller");
const db_1 = require("../../../src/db");
describe('authorize controller', () => {
    it('returns code for valid user', async () => {
        // ⭐ Mock user lookup
        db_1.prisma.user.findUnique.mockResolvedValue({
            id: 'client-123',
            email: 'test@example.com',
            password: '$2b$10$hashedpasswordexample1234567890abcdefghi',
        });
        // ⭐ Mock OAuth client lookup — MUST be one of your real clients
        db_1.prisma.oAuthClient.findUnique.mockResolvedValue({
            id: 'client-123',
            name: 'Test Client',
            secret: 'basic-secret',
        });
        // ⭐ Mock authorization code creation
        db_1.prisma.oAuthAuthorizationCode.create.mockResolvedValue({
            code: 'auth-code',
            userId: 'user-123',
            clientId: 'client-basic',
            state: null,
            expiresAt: new Date(Date.now() + 60000),
            used: false,
        });
        const req = {
            body: {
                userId: 'user-123',
                clientId: 'client-basic', // ✔ must match mock + real system
                scope: 'read', // ✔ allowed for client-basic
            },
        };
        const res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        await (0, oauth_controller_1.authorize)(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            code: expect.any(String),
            state: null,
        });
    });
});
