"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const setup_1 = require("../../setup");
const db_1 = require("../../../src/db");
describe("JWT Authentication – Invalid Tokens", () => {
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
    test("Missing JWT returns 401", async () => {
        const res = await (0, supertest_1.default)(app_1.default).get("/jwt/protected");
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("No token provided");
    });
    test("Invalid JWT returns 401", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/jwt/protected")
            .set("Authorization", "Bearer invalid.token.here");
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid token");
    });
});
