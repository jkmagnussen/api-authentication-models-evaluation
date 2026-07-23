"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../src/app"));
describe("Authorization header ambiguity", () => {
    it("rejects malformed Bearer header with no token", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/jwt/protected")
            .set("Authorization", "Bearer");
        expect(res.status).toBe(401);
    });
    it("rejects Bearer header with extra token segments", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/jwt/protected")
            .set("Authorization", "Bearer token-one token-two");
        expect(res.status).toBe(401);
    });
    it("rejects non-bearer authorization type", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/oauth/protected")
            .set("Authorization", "Basic Y2xpZW50OmZha2U=");
        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Missing Authorization header");
    });
});
