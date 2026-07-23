"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
describe("Session Authentication – Protected Route", () => {
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
    test("Protected route returns 200 for valid session and 401 for invalid", async () => {
        await db_1.prisma.session.create({
            data: {
                id: "valid-session",
                userId: "user-123",
                expiresAt: new Date(Date.now() + 60000)
            }
        });
        const ok = await (0, supertest_1.default)(app_1.default)
            .get("/sessions/protected")
            .set("Cookie", "sessionId=valid-session");
        expect(ok.status).toBe(200);
        expect(ok.body.userId).toBe("user-123");
        const bad = await (0, supertest_1.default)(app_1.default)
            .get("/sessions/protected")
            .set("Cookie", "sessionId=does-not-exist");
        expect(bad.status).toBe(401);
        expect(bad.body.message).toBe("Invalid session");
    });
});
