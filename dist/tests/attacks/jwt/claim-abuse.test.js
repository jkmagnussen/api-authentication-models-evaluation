"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
describe("JWT claim abuse", () => {
    const secret = process.env.JWT_SECRET || "dev-secret";
    it("rejects token with nbf set in the future", async () => {
        const token = jsonwebtoken_1.default.sign({
            userId: "user-123",
            nbf: Math.floor(Date.now() / 1000) + 3600,
        }, secret, { expiresIn: "2h" });
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/jwt/protected")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Invalid token");
    });
    it("rejects token without userId claim", async () => {
        const token = jsonwebtoken_1.default.sign({
            aud: "api-auth-eval",
            iss: "api-auth-service",
        }, secret, { expiresIn: "1h" });
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/jwt/protected")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(401);
    });
});
