"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
describe("JWT Authentication – Protected Route", () => {
    let token;
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
        // ⭐ Login to get a valid JWT
        const login = await (0, supertest_1.default)(app_1.default)
            .post("/jwt/login")
            .send({ email: "test@example.com", password: "password" });
        token = login.body.token;
    });
    test("Protected route returns 200 for valid JWT", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/jwt/protected")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.userId).toBe("user-123");
    });
});
