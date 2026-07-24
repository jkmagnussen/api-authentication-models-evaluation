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
describe('Session fixation', () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: validUUID,
                email: 'test@example.com',
                password: 'password',
            },
        });
    });
    it('rejects a pre-login fixed session id and issues a fresh one', async () => {
        const fixedId = 'attacker-fixed-session-id';
        const loginRes = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/login')
            .set('Cookie', `sessionId=${fixedId}`)
            .send({ email: 'test@example.com', password: 'password' });
        expect(loginRes.status).toBe(200);
        const cookieHeader = loginRes.headers['set-cookie'];
        const sessionCookie = Array.isArray(cookieHeader) ? cookieHeader[0] : '';
        expect(sessionCookie).toContain('sessionId=');
        expect(sessionCookie).not.toContain(`sessionId=${fixedId}`);
        const stolen = await db_1.prisma.session.findUnique({ where: { id: fixedId } });
        expect(stolen).toBeNull();
    });
    it('invalidates the old session after re-login', async () => {
        const first = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/login')
            .send({ email: 'test@example.com', password: 'password' });
        const firstCookieHeader = first.headers['set-cookie'];
        const firstCookie = Array.isArray(firstCookieHeader) ? firstCookieHeader[0] : '';
        const second = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/login')
            .set('Cookie', firstCookie)
            .send({ email: 'test@example.com', password: 'password' });
        expect(second.status).toBe(200);
        const match = /sessionId=([^;]+)/.exec(firstCookie);
        const oldId = match?.[1];
        expect(oldId).toBeDefined();
        const oldSession = await db_1.prisma.session.findUnique({ where: { id: oldId } });
        expect(oldSession).toBeNull();
    });
});
