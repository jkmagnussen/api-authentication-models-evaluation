"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup");
const db_1 = require("../../../src/db");
// Helper to extract name=value from set-cookie header
function extractCookieValue(setCookieHeader) {
    return setCookieHeader.split(';')[0];
}
describe('Sessions – CSRF Attack Test', () => {
    let sessionCookie;
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: 'user-123',
                email: 'test@example.com',
                password: 'password',
            },
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/login')
            .send({ email: 'test@example.com', password: 'password' });
        // sessionId cookie from login - extract only name=value
        const cookieHeader = res.headers['set-cookie'];
        sessionCookie = Array.isArray(cookieHeader) ? extractCookieValue(cookieHeader[0]) : '';
    });
    test('Request with valid CSRF token should succeed', async () => {
        // 1. Get CSRF token + CSRF cookie
        const csrfRes = await (0, supertest_1.default)(app_1.default).get('/sessions/csrf-token').set('Cookie', sessionCookie);
        const validToken = csrfRes.body.csrfToken;
        const csrfCookieHeader = csrfRes.headers['set-cookie'];
        const csrfCookie = Array.isArray(csrfCookieHeader) ? extractCookieValue(csrfCookieHeader[0]) : '';
        // 2. Combine both cookies: sessionId + _csrf
        const combinedCookies = `${sessionCookie}; ${csrfCookie}`;
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/protected-action')
            .set('Cookie', combinedCookies)
            .set('x-csrf-token', validToken) // csurf default header name
            .send({ action: 'transfer-money' });
        expect(res.status).toBe(200);
    });
    test('Missing CSRF token should be rejected', async () => {
        const csrfRes = await (0, supertest_1.default)(app_1.default).get('/sessions/csrf-token').set('Cookie', sessionCookie);
        const csrfCookieHeader = csrfRes.headers['set-cookie'];
        const csrfCookie = Array.isArray(csrfCookieHeader) ? extractCookieValue(csrfCookieHeader[0]) : '';
        const combinedCookies = `${sessionCookie}; ${csrfCookie}`;
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/protected-action')
            .set('Cookie', combinedCookies)
            .send({ action: 'transfer-money' });
        expect(res.status).toBe(403);
    });
    test('Invalid CSRF token should be rejected', async () => {
        const csrfRes = await (0, supertest_1.default)(app_1.default).get('/sessions/csrf-token').set('Cookie', sessionCookie);
        const csrfCookieHeader = csrfRes.headers['set-cookie'];
        const csrfCookie = Array.isArray(csrfCookieHeader) ? extractCookieValue(csrfCookieHeader[0]) : '';
        const combinedCookies = `${sessionCookie}; ${csrfCookie}`;
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/protected-action')
            .set('Cookie', combinedCookies)
            .set('x-csrf-token', 'invalid-csrf-token')
            .send({ action: 'transfer-money' });
        expect(res.status).toBe(403);
    });
    test('Missing CSRF cookie should be rejected even with token', async () => {
        const csrfRes = await (0, supertest_1.default)(app_1.default).get('/sessions/csrf-token').set('Cookie', sessionCookie);
        const validToken = csrfRes.body.csrfToken;
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/sessions/protected-action')
            .set('Cookie', sessionCookie)
            .set('x-csrf-token', validToken)
            .send({ action: 'transfer-money' });
        expect(res.status).toBe(403);
    });
});
