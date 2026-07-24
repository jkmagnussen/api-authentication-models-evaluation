"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const totp_1 = require("../../../src/auth/totp");
const setup_1 = require("../../setup");
describe('Cross-cutting auth security', () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: 'user-123',
                email: 'test@example.com',
                password: 'password123',
            },
        });
    });
    test('password reset request and confirm updates the login password', async () => {
        const requestRes = await (0, supertest_1.default)(app_1.default)
            .post('/auth/security/password-reset/request')
            .send({ email: 'test@example.com' });
        expect(requestRes.status).toBe(202);
        expect(requestRes.body.reset_token).toBeDefined();
        const confirmRes = await (0, supertest_1.default)(app_1.default)
            .post('/auth/security/password-reset/confirm')
            .send({ token: requestRes.body.reset_token, newPassword: 'password456' });
        expect(confirmRes.status).toBe(200);
        const loginRes = await (0, supertest_1.default)(app_1.default)
            .post('/jwt/login')
            .send({ email: 'test@example.com', password: 'password456' });
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toBeDefined();
    });
    test('mfa enrollment and verification enable MFA', async () => {
        const enrollRes = await (0, supertest_1.default)(app_1.default)
            .post('/auth/security/mfa/enroll')
            .send({ email: 'test@example.com', password: 'password123' });
        expect(enrollRes.status).toBe(200);
        expect(enrollRes.body.secret).toBeDefined();
        const verifyRes = await (0, supertest_1.default)(app_1.default)
            .post('/auth/security/mfa/verify')
            .send({ email: 'test@example.com', code: (0, totp_1.generateCurrentTotp)(enrollRes.body.secret) });
        expect(verifyRes.status).toBe(200);
        const user = await db_1.prisma.user.findUnique({ where: { id: 'user-123' } });
        expect(user?.mfaEnabled).toBe(true);
    });
    test('jwt login requires MFA once enabled', async () => {
        const enrollRes = await (0, supertest_1.default)(app_1.default)
            .post('/auth/security/mfa/enroll')
            .send({ email: 'test@example.com', password: 'password123' });
        await (0, supertest_1.default)(app_1.default)
            .post('/auth/security/mfa/verify')
            .send({ email: 'test@example.com', code: (0, totp_1.generateCurrentTotp)(enrollRes.body.secret) });
        const jwtWithoutMfa = await (0, supertest_1.default)(app_1.default)
            .post('/jwt/login')
            .send({ email: 'test@example.com', password: 'password123' });
        expect(jwtWithoutMfa.status).toBe(401);
        const jwtWithMfa = await (0, supertest_1.default)(app_1.default)
            .post('/jwt/login')
            .send({
            email: 'test@example.com',
            password: 'password123',
            mfaCode: (0, totp_1.generateCurrentTotp)(enrollRes.body.secret),
        });
        expect(jwtWithMfa.status).toBe(200);
    });
    test('session login requires MFA once enabled', async () => {
        const enrollRes = await (0, supertest_1.default)(app_1.default)
            .post('/auth/security/mfa/enroll')
            .send({ email: 'test@example.com', password: 'password123' });
        await (0, supertest_1.default)(app_1.default)
            .post('/auth/security/mfa/verify')
            .send({ email: 'test@example.com', code: (0, totp_1.generateCurrentTotp)(enrollRes.body.secret) });
        const sessionWithoutMfa = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/login')
            .send({ email: 'test@example.com', password: 'password123' });
        expect(sessionWithoutMfa.status).toBe(401);
        const sessionWithMfa = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/login')
            .send({
            email: 'test@example.com',
            password: 'password123',
            mfaCode: (0, totp_1.generateCurrentTotp)(enrollRes.body.secret),
        });
        expect(sessionWithMfa.status).toBe(200);
    });
});
