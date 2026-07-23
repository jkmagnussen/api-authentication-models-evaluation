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
describe("OAuth refresh-token replay and rotation", () => {
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
    it("rotates refresh token and rejects replay", async () => {
        const authRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({ userId: validUUID, clientId: "client-basic", scope: "read" });
        const tokenRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/token")
            .send({ code: authRes.body.code });
        const firstRefresh = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/refresh")
            .send({ refresh_token: tokenRes.body.refresh_token, client_id: "client-basic" });
        expect(firstRefresh.status).toBe(200);
        expect(firstRefresh.body.refresh_token).toBeDefined();
        expect(firstRefresh.body.refresh_token).not.toBe(tokenRes.body.refresh_token);
        const replay = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/refresh")
            .send({ refresh_token: tokenRes.body.refresh_token, client_id: "client-basic" });
        expect(replay.status).toBe(400);
        expect(replay.body.error).toBe("invalid_grant");
    });
    it("rejects refresh token when client does not match", async () => {
        const authRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({ userId: validUUID, clientId: "client-basic", scope: "read" });
        const tokenRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/token")
            .send({ code: authRes.body.code });
        const wrongClient = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/refresh")
            .send({ refresh_token: tokenRes.body.refresh_token, client_id: "client-privileged" });
        expect(wrongClient.status).toBe(400);
        expect(wrongClient.body.error).toBe("invalid_grant");
    });
});
