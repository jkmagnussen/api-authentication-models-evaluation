"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
let validToken;
describe("JWT – Forgery Attack Tests", () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        // ⭐ Create user AFTER resetDatabase
        await db_1.prisma.user.create({
            data: {
                id: "user-123",
                email: "test@example.com",
                password: "password"
            }
        });
        // ⭐ Login to get a valid token
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/jwt/login")
            .send({ email: "test@example.com", password: "password" });
        validToken = res.body.token;
    });
    test("Tampered payload should be rejected", async () => {
        const parts = validToken.split(".");
        const header = parts[0];
        const payload = parts[1];
        const signature = parts[2];
        const tamperedPayload = Buffer.from(JSON.stringify({ userId: "attacker" })).toString("base64url");
        const tamperedToken = `${header}.${tamperedPayload}.${signature}`;
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/jwt/protected")
            .set("Authorization", `Bearer ${tamperedToken}`);
        expect(res.status).toBe(401);
    });
});
