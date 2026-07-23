"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
const db_1 = require("../../../src/db");
const setup_1 = require("../../setup");
const crypto_1 = __importDefault(require("crypto"));
const validUUID = "123e4567-e89b-12d3-a456-426614174000";
describe("OAuth PKCE downgrade and method abuse", () => {
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
    it("rejects plain verifier when code was issued with S256 challenge", async () => {
        const codeVerifier = "strong-verifier-value-123";
        const codeChallenge = crypto_1.default.createHash("sha256").update(codeVerifier).digest("base64url");
        const authRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({
            userId: validUUID,
            clientId: "client-basic",
            scope: "read",
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/token")
            .send({
            code: authRes.body.code,
            code_verifier: codeChallenge,
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("invalid_grant");
    });
    it("rejects empty code_verifier when PKCE is required", async () => {
        const authRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({
            userId: validUUID,
            clientId: "client-basic",
            scope: "read",
            code_challenge: "abc123",
            code_challenge_method: "plain",
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/token")
            .send({
            code: authRes.body.code,
            code_verifier: "",
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("invalid_request");
    });
    it("rejects malformed code_verifier type", async () => {
        const authRes = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/authorize")
            .send({
            userId: validUUID,
            clientId: "client-basic",
            scope: "read",
            code_challenge: "abc123",
            code_challenge_method: "plain",
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/oauth/token")
            .send({
            code: authRes.body.code,
            code_verifier: ["abc123"],
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("invalid_grant");
    });
});
