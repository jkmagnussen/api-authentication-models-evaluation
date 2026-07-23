"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
const validUUID = "123e4567-e89b-12d3-a456-426614174000";
describe("Login enumeration", () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: validUUID,
                email: "test@example.com",
                password: "password",
            },
        });
    });
    it("does not reveal account existence on sessions login", async () => {
        const unknown = await (0, supertest_1.default)(app_1.default)
            .post("/sessions/login")
            .send({ email: "unknown@example.com", password: "password" });
        const wrongPassword = await (0, supertest_1.default)(app_1.default)
            .post("/sessions/login")
            .send({ email: "test@example.com", password: "wrong-password" });
        expect(unknown.status).toBe(wrongPassword.status);
        expect(unknown.body).toEqual(wrongPassword.body);
        expect(unknown.body.message).toBe("Invalid credentials");
    });
});
