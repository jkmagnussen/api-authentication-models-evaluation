"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup"); // ⭐ Use your global reset
const oauth_service_1 = require("../../../src/oauth/oauth.service");
const validUUID = '123e4567-e89b-12d3-a456-426614174000';
jest.mock('../../../src/oauth/oauth.service', () => ({
    createAuthorizationCode: jest.fn(),
    exchangeCodeForToken: jest.fn(),
    validateAccessToken: jest.fn(),
}));
describe('OAuth Negative Path Tests', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        // ⭐ Use the global DB reset (correct FK order)
        await (0, setup_1.resetDatabase)();
    });
    // ---------------------------
    // AUTHORIZATION CODE NEGATIVE TESTS
    // ---------------------------
    it('POST /oauth/authorize → rejects missing userId', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({});
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'userId is required' });
    });
    it('POST /oauth/authorize → rejects non-string userId', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({ userId: 123 });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'userId must be a string' });
    });
    it('POST /oauth/authorize → rejects non-UUID userId', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({ userId: 'not-a-uuid' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'userId must be a valid UUID' });
    });
    it('POST /oauth/authorize → rejects userId not found in DB', async () => {
        // ⭐ Delete user safely using resetDatabase
        await (0, setup_1.resetDatabase)();
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({ userId: validUUID });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'User does not exist' });
    });
    // ---------------------------
    // TOKEN ENDPOINT NEGATIVE TESTS
    // ---------------------------
    it('POST /oauth/token → rejects missing code', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/token').send({});
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            error: 'authorization code is required and must be a string',
        });
    });
    it('POST /oauth/token → rejects non-string code', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/token').send({ code: 123 });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            error: 'authorization code is required and must be a string',
        });
    });
    it('POST /oauth/token → rejects invalid authorization code', async () => {
        oauth_service_1.exchangeCodeForToken.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.default).post('/oauth/token').send({ code: 'invalid-code' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid authorization code' });
    });
    // ---------------------------
    // PROTECTED ROUTE NEGATIVE TESTS
    // ---------------------------
    it('GET /oauth/protected → rejects missing Authorization header', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/oauth/protected');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Missing Authorization header' });
    });
    it('GET /oauth/protected → rejects malformed Authorization header', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/oauth/protected').set('Authorization', 'Token abc123');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Missing Authorization header' });
    });
    it('GET /oauth/protected → rejects invalid JWT', async () => {
        oauth_service_1.validateAccessToken.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/oauth/protected')
            .set('Authorization', 'Bearer invalid.jwt.token');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid or expired token' });
    });
    it('GET /oauth/protected → rejects expired JWT', async () => {
        oauth_service_1.validateAccessToken.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/oauth/protected')
            .set('Authorization', 'Bearer expired.jwt.token');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid or expired token' });
    });
    it('GET /oauth/protected → rejects tampered JWT', async () => {
        oauth_service_1.validateAccessToken.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/oauth/protected')
            .set('Authorization', 'Bearer tampered.jwt.token');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid or expired token' });
    });
});
