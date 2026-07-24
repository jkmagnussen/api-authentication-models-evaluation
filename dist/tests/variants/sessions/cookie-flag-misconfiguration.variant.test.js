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
describe('Session cookie flag misconfiguration exploit', () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'test@example.com',
                password: 'password',
            },
        });
    });
    it('issues a session cookie without HttpOnly', async () => {
        const loginRes = await (0, supertest_1.default)(app)
            .post('/sessions/login')
            .send({ email: 'test@example.com', password: 'password' });
        expect(loginRes.status).toBe(200);
        const cookieHeader = loginRes.headers['set-cookie'];
        const sessionCookie = Array.isArray(cookieHeader) ? cookieHeader[0] : '';
        expect(sessionCookie).not.toContain('HttpOnly');
    });
});
