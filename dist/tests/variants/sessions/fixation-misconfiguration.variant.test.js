"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const load_variant_app_1 = require("../load-variant-app");
const setup_1 = require("../../setup");
const db_1 = require("../../../src/db");
const app = (0, load_variant_app_1.loadVariantApp)();
const validUuid = '123e4567-e89b-12d3-a456-426614174000';
describe('Session fixation misconfiguration exploit', () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: validUuid,
                email: 'test@example.com',
                password: 'password',
            },
        });
    });
    it('preserves attacker-controlled session id through login', async () => {
        const fixedSessionId = 'attacker-fixed-session-id';
        const loginRes = await (0, supertest_1.default)(app)
            .post('/sessions/login')
            .set('Cookie', `sessionId=${fixedSessionId}`)
            .send({ email: 'test@example.com', password: 'password' });
        expect(loginRes.status).toBe(200);
        const cookieHeader = loginRes.headers['set-cookie'];
        const sessionCookie = Array.isArray(cookieHeader) ? cookieHeader[0] : '';
        expect(sessionCookie).toContain(`sessionId=${fixedSessionId}`);
        const storedSession = await db_1.prisma.session.findUnique({ where: { id: fixedSessionId } });
        expect(storedSession?.userId).toBe(validUuid);
    });
});
