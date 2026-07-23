"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
describe("Session Authentication – Expired Session Attack", () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: "user-123",
                email: "test@example.com",
                password: "password"
            }
        });
    });
    test("Expired session should be rejected", async () => {
        await db_1.prisma.session.create({
            data: {
                id: "expired-session",
                userId: "user-123",
                expiresAt: new Date(Date.now() - 60000) // expired 1 min ago
            }
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/sessions/protected")
            .set("Cookie", "sessionId=expired-session");
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Session expired");
    });
});
