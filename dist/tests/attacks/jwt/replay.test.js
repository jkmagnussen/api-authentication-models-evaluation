"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
describe("JWT – Replay Attack Test", () => {
    let token;
    beforeAll(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: "user-123",
                email: "test@example.com",
                password: "password",
            },
        });
        // Login → get valid JWT
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/jwt/login")
            .send({ email: "test@example.com", password: "password" });
        token = res.body.token;
    });
    test("Reusing the same JWT should still succeed until expiry", async () => {
        // First use — should succeed
        const firstRes = await (0, supertest_1.default)(app_1.default)
            .get("/jwt/protected")
            .set("Authorization", `Bearer ${token}`);
        expect(firstRes.status).toBe(200);
        // Replay the exact same token — should also succeed
        const replayRes = await (0, supertest_1.default)(app_1.default)
            .get("/jwt/protected")
            .set("Authorization", `Bearer ${token}`);
        expect(replayRes.status).toBe(200);
    });
    test("Expired JWT should fail", async () => {
        // Manually craft an invalid/expired token
        const expiredToken = `${token}EXPIRED`;
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/jwt/protected")
            .set("Authorization", `Bearer ${expiredToken}`);
        expect(res.status).toBe(401);
    });
});
