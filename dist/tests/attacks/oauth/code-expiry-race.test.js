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
describe("OAuth authorization-code expiry boundary and race", () => {
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
    it("rejects a code that is already expired at exchange time", async () => {
        await db_1.prisma.oAuthAuthorizationCode.create({
            data: {
                code: "expired-now-code",
                userId: validUUID,
                clientId: "client-basic",
                scope: "read",
                expiresAt: new Date(Date.now() - 1),
                used: false,
            },
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/token")
            .send({ code: "expired-now-code" });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid authorization code");
    });
    it("allows at most one successful exchange under concurrent race", async () => {
        const authRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({
            userId: validUUID,
            clientId: "client-basic",
            scope: "read",
        });
        const code = authRes.body.code;
        const results = await Promise.all([
            (0, supertest_1.default)(app_1.default).post("/oauth/token").send({ code }),
            (0, supertest_1.default)(app_1.default).post("/oauth/token").send({ code }),
            (0, supertest_1.default)(app_1.default).post("/oauth/token").send({ code }),
            (0, supertest_1.default)(app_1.default).post("/oauth/token").send({ code }),
            (0, supertest_1.default)(app_1.default).post("/oauth/token").send({ code }),
        ]);
        const successCount = results.filter((res) => res.status === 200).length;
        const failureCount = results.filter((res) => res.status === 400).length;
        expect(successCount).toBe(1);
        expect(failureCount).toBe(4);
    });
});
