"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup"); // ⭐ Use global reset
const db_1 = require("../../../src/db");
const oauth_service_1 = require("../../../src/oauth/oauth.service");
const validUUID = '123e4567-e89b-12d3-a456-426614174000';
jest.mock('../../../src/oauth/oauth.service', () => ({
    exchangeCodeForToken: jest.fn(),
    validateAccessToken: jest.fn(),
}));
describe('OAuth Lifecycle Tests', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        // ⭐ Use global DB reset (correct FK order + OAuth client recreated)
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: validUUID,
                email: 'test@example.com',
                password: 'hashed-password',
            },
        });
    });
    // ---------------------------
    // EXPIRED AUTHORIZATION CODE
    // ---------------------------
    it('POST /oauth/token → rejects expired authorization code', async () => {
        // ⭐ Insert expired code (only valid fields)
        await db_1.prisma.oAuthAuthorizationCode.create({
            data: {
                code: 'expired-code-123',
                userId: validUUID,
                expiresAt: new Date(Date.now() - 10000), // expired
                used: false,
                clientId: 'client-123',
            },
        });
        // Force service to return null (invalid)
        oauth_service_1.exchangeCodeForToken.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/token').send({ code: 'expired-code-123' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid authorization code' });
    });
    // ---------------------------
    // REUSED AUTHORIZATION CODE
    // ---------------------------
    it('POST /oauth/token → rejects reused authorization code', async () => {
        // ⭐ Insert USED code (only valid fields)
        await db_1.prisma.oAuthAuthorizationCode.create({
            data: {
                code: 'used-code-123',
                userId: validUUID,
                expiresAt: new Date(Date.now() + 60000), // still valid
                used: true, // already used
                clientId: 'client-123',
            },
        });
        // Force service to return null (invalid)
        oauth_service_1.exchangeCodeForToken.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/token').send({ code: 'used-code-123' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Authorization code already used' });
    });
});
