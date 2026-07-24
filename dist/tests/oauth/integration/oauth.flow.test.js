"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup"); // ⭐ Use global reset
const validUUID = '123e4567-e89b-12d3-a456-426614174000';
describe('OAuth Integration Flow', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        // ⭐ Global DB reset (correct FK order + OAuth client recreated)
        await (0, setup_1.resetDatabase)();
        // ⭐ Recreate base user (resetDatabase should NOT create users)
        await db_1.prisma.user.create({
            data: {
                id: validUUID,
                email: 'test@example.com',
                password: 'hashed-password',
            },
        });
    });
    // -----------------------------------------------------
    // AUTHORIZE → RETURNS CODE
    // -----------------------------------------------------
    it('POST /oauth/authorize → returns authorization code for valid user', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-basic',
            scope: 'read',
        });
        expect(res.status).toBe(200);
        const stored = await db_1.prisma.oAuthAuthorizationCode.findFirst();
        expect(res.body).toEqual({
            code: stored?.code,
            state: stored?.state ?? null,
        });
    });
    // -----------------------------------------------------
    // TOKEN → RETURNS JWT
    // -----------------------------------------------------
    it('POST /oauth/token → returns JWT for valid authorization code', async () => {
        // Step 1: generate code
        await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-basic',
            scope: 'read',
        });
        const stored = await db_1.prisma.oAuthAuthorizationCode.findFirst();
        // Step 2: exchange code
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/token').send({ code: stored?.code });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('refresh_token');
        expect(res.body).toHaveProperty('token_type', 'Bearer');
        expect(res.body).toHaveProperty('expires_in');
    });
    // -----------------------------------------------------
    // PROTECTED ROUTE → MISSING HEADER
    // -----------------------------------------------------
    it('GET /oauth/protected → rejects missing Authorization header', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/oauth/protected');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Missing Authorization header' });
    });
    // -----------------------------------------------------
    // PROTECTED ROUTE → INVALID JWT
    // -----------------------------------------------------
    it('GET /oauth/protected → rejects invalid JWT', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/oauth/protected')
            .set('Authorization', 'Bearer invalid.jwt.token');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid or expired token' });
    });
    // -----------------------------------------------------
    // PROTECTED ROUTE → VALID JWT
    // -----------------------------------------------------
    it('GET /oauth/protected → accepts valid JWT', async () => {
        jest
            .spyOn(require('../../../src/oauth/oauth.service'), 'validateAccessToken')
            .mockResolvedValue({ userId: validUUID });
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/oauth/protected')
            .set('Authorization', 'Bearer valid.jwt.token');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            message: 'Protected resource accessed',
            user_id: validUUID,
        });
    });
});
