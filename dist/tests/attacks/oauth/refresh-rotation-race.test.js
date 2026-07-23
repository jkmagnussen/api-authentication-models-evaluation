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
describe("OAuth refresh-token rotation race", () => {
    beforeEach(async () => {
        await (0, setup_1.resetDatabase)();
        await db_1.prisma.user.create({
            data: {
                id: validUUID,
                email: "test@example.com",
                password: "hashed-password",
            },
        });
    });
    it("allows only one successful refresh across 10 concurrent attempts", async () => {
        const authRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({
            userId: validUUID,
            clientId: "client-basic",
            scope: "read",
        });
        const tokenRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/token")
            .send({ code: authRes.body.code });
        const originalRefreshToken = tokenRes.body.refresh_token;
        const results = await Promise.all(Array.from({ length: 10 }).map(() => (0, supertest_1.default)(app_1.default)
            .post("/oauth/refresh")
            .send({ refresh_token: originalRefreshToken, client_id: "client-basic" })));
        const successCount = results.filter((res) => res.status === 200).length;
        const invalidGrantCount = results.filter((res) => res.status === 400 && res.body?.error === "invalid_grant").length;
        expect(successCount).toBe(1);
        expect(invalidGrantCount).toBe(9);
    });
});
