"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../src/app"));
const db_1 = require("../../src/db");
const setup_1 = require("../setup");
function getCookieValue(cookieHeader, name) {
    if (!cookieHeader)
        return undefined;
    const header = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
    const match = header.match(new RegExp(`(^|; )${name}=([^;]+)`));
    return match ? match[2] : undefined;
}
describe("Auth security regression tests", () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                email: "test@example.com",
                password: "password",
            },
        });
    });
    test("login endpoints are rate-limited after repeated attempts", async () => {
        const results = [];
        for (let i = 0; i < 6; i += 1) {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/jwt/login")
                .send({ email: "test@example.com", password: "password" });
            results.push({ status: res.status });
        }
        expect(results.some((result) => result.status === 429)).toBe(true);
    });
    test("logging in invalidates a previously issued session cookie", async () => {
        const firstLogin = await (0, supertest_1.default)(app_1.default)
            .post("/sessions/login")
            .send({ email: "test@example.com", password: "password" });
        const firstCookieHeader = firstLogin.headers["set-cookie"];
        const firstSessionId = getCookieValue(firstCookieHeader, "sessionId");
        expect(firstSessionId).toBeDefined();
        const secondLogin = await (0, supertest_1.default)(app_1.default)
            .post("/sessions/login")
            .set("Cookie", `sessionId=${firstSessionId}`)
            .send({ email: "test@example.com", password: "password" });
        const secondCookieHeader = secondLogin.headers["set-cookie"];
        const secondSessionId = getCookieValue(secondCookieHeader, "sessionId");
        expect(secondSessionId).toBeDefined();
        expect(secondSessionId).not.toBe(firstSessionId);
        const oldSession = await db_1.prisma.session.findUnique({ where: { id: firstSessionId } });
        expect(oldSession).toBeNull();
    });
    test("refresh tokens are rotated and cannot be reused", async () => {
        const authorizeRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({ userId: "123e4567-e89b-12d3-a456-426614174000", clientId: "client-basic" });
        const code = authorizeRes.body.code;
        const tokenRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/token")
            .send({ code });
        const refreshToken = tokenRes.body.refresh_token;
        const firstRefresh = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/refresh")
            .send({ refreshToken: refreshToken, clientId: "client-basic" });
        expect(firstRefresh.status).toBe(200);
        const replayRefresh = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/refresh")
            .send({ refreshToken: refreshToken, clientId: "client-basic" });
        expect(replayRefresh.status).toBe(400);
        expect(replayRefresh.body.error).toBe("invalid_grant");
    });
});
