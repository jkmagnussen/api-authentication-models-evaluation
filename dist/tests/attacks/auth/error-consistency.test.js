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
describe("Error-message consistency", () => {
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
    it("returns the same JWT login error for unknown user and wrong password", async () => {
        const unknownUser = await (0, supertest_1.default)(app_1.default)
            .post("/jwt/login")
            .send({ email: "nobody@example.com", password: "password" });
        const wrongPassword = await (0, supertest_1.default)(app_1.default)
            .post("/jwt/login")
            .send({ email: "test@example.com", password: "wrong-password" });
        expect(unknownUser.status).toBe(wrongPassword.status);
        expect(unknownUser.body).toEqual(wrongPassword.body);
        expect(unknownUser.body.error).toBe("Invalid credentials");
    });
    it("returns a stable error for invalid and expired OAuth authorization codes", async () => {
        const invalid = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/token")
            .send({ code: "not-a-real-code" });
        await db_1.prisma.oAuthAuthorizationCode.create({
            data: {
                code: "expired-code",
                userId: validUUID,
                clientId: "client-basic",
                expiresAt: new Date(Date.now() - 10000),
                used: false,
            },
        });
        const expired = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/token")
            .send({ code: "expired-code" });
        expect(invalid.status).toBe(400);
        expect(expired.status).toBe(400);
        expect(invalid.body.error).toBe("Invalid authorization code");
        expect(expired.body.error).toBe("Invalid authorization code");
    });
});
