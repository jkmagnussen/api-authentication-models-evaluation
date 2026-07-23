"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.JWT_SECRET = "test-secret";
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const setup_1 = require("../../setup");
const db_1 = require("../../../src/db");
describe("JWT Authentication – Expiry", () => {
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
    test("Expired JWT returns 401", async () => {
        process.env.JWT_SECRET = "dev-secret";
        const expiredToken = jsonwebtoken_1.default.sign({ userId: "user-123" }, process.env.JWT_SECRET, { expiresIn: -10 });
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/jwt/protected")
            .set("Authorization", `Bearer ${expiredToken}`);
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Token expired");
    });
});
