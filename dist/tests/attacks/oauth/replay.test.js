"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
const validUUID = '123e4567-e89b-12d3-a456-426614174000';
describe('OAuth – Replay Attack', () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: validUUID,
                email: 'test@example.com',
                password: 'hashed-password',
            },
        });
    });
    it('Reusing an authorization code should be rejected', async () => {
        await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-basic',
            scope: 'read',
            code_challenge: 'abc',
            code_challenge_method: 'plain',
        });
        const stored = await db_1.prisma.oAuthAuthorizationCode.findFirst();
        const firstRes = await (0, supertest_1.default)(app_1.default).post('/oauth/token').send({
            code: stored?.code,
            code_verifier: 'abc',
            clientId: 'client-basic',
        });
        expect(firstRes.status).toBe(200);
        expect(firstRes.body).toHaveProperty('access_token');
        const replayRes = await (0, supertest_1.default)(app_1.default).post('/oauth/token').send({
            code: stored?.code,
            code_verifier: 'abc',
            clientId: 'client-basic',
        });
        expect(replayRes.status).toBe(400);
        expect(replayRes.body.error).toBe('Invalid authorization code');
    });
    it('The token exchange must bind the code to the issuing client', async () => {
        await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-basic',
            scope: 'read',
            code_challenge: 'xyz',
            code_challenge_method: 'plain',
        });
        const stored = await db_1.prisma.oAuthAuthorizationCode.findFirst();
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/oauth/token')
            .set('Authorization', 'Basic Y2xpZW50LXByaXZpbGVnZWQ6cHJpdmlsZWdlZC1zZWNyZXQ=')
            .send({
            code: stored?.code,
            code_verifier: 'xyz',
        });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('invalid_client');
    });
    it('Concurrent token exchanges should only succeed once per authorization code', async () => {
        await (0, supertest_1.default)(app_1.default).post('/oauth/authorize').send({
            userId: validUUID,
            clientId: 'client-basic',
            scope: 'read',
            code_challenge: 'same',
            code_challenge_method: 'plain',
        });
        const stored = await db_1.prisma.oAuthAuthorizationCode.findFirst();
        const results = await Promise.all([
            (0, supertest_1.default)(app_1.default)
                .post('/oauth/token')
                .send({ code: stored?.code, code_verifier: 'same', clientId: 'client-basic' }),
            (0, supertest_1.default)(app_1.default)
                .post('/oauth/token')
                .send({ code: stored?.code, code_verifier: 'same', clientId: 'client-basic' }),
            (0, supertest_1.default)(app_1.default)
                .post('/oauth/token')
                .send({ code: stored?.code, code_verifier: 'same', clientId: 'client-basic' }),
        ]);
        const successCount = results.filter((res) => res.status === 200).length;
        const failureCount = results.filter((res) => res.status === 400).length;
        expect(successCount).toBe(1);
        expect(failureCount).toBe(2);
    });
});
