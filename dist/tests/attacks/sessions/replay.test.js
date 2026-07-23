"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup");
const db_1 = require("../../../src/db");
describe("Sessions – Replay Attack Test", () => {
    let cookie;
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: "user-123",
                email: "test@example.com",
                password: "password"
            }
        });
        // Login → get a valid session cookie
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/sessions/login")
            .send({ email: "test@example.com", password: "password" });
        cookie = res.headers["set-cookie"][0];
    });
    test("Reusing the same session cookie should still succeed until session expiry", async () => {
        const firstRes = await (0, supertest_1.default)(app_1.default)
            .get("/sessions/protected")
            .set("Cookie", cookie);
        expect(firstRes.status).toBe(200);
        const replayRes = await (0, supertest_1.default)(app_1.default)
            .get("/sessions/protected")
            .set("Cookie", cookie);
        expect(replayRes.status).toBe(200);
    });
    test("Replayed cookie after logout should fail", async () => {
        await (0, supertest_1.default)(app_1.default)
            .post("/sessions/logout")
            .set("Cookie", cookie);
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/sessions/protected")
            .set("Cookie", cookie);
        expect(res.status).toBe(401);
    });
    test("A fresh login should replace a previously issued session cookie", async () => {
        const firstLogin = await (0, supertest_1.default)(app_1.default)
            .post("/sessions/login")
            .send({ email: "test@example.com", password: "password" });
        const firstCookie = firstLogin.headers["set-cookie"][0];
        const secondLogin = await (0, supertest_1.default)(app_1.default)
            .post("/sessions/login")
            .set("Cookie", firstCookie)
            .send({ email: "test@example.com", password: "password" });
        const secondCookie = secondLogin.headers["set-cookie"][0];
        const oldSessionRes = await (0, supertest_1.default)(app_1.default)
            .get("/sessions/protected")
            .set("Cookie", firstCookie);
        const newSessionRes = await (0, supertest_1.default)(app_1.default)
            .get("/sessions/protected")
            .set("Cookie", secondCookie);
        expect(oldSessionRes.status).toBe(401);
        expect(newSessionRes.status).toBe(200);
    });
});
