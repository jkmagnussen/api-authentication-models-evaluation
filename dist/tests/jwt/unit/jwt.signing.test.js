"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_service_1 = require("../../../src/jwt/jwt.service");
describe("JWT Signing – Unit Tests", () => {
    process.env.JWT_SECRET = "test-secret";
    const SECRET = process.env.JWT_SECRET;
    test("generateJwt returns a valid signed token", () => {
        const token = (0, jwt_service_1.generateJwt)("user-123");
        expect(token).toBeDefined();
        const decoded = jsonwebtoken_1.default.verify(token, SECRET);
        expect(decoded.userId).toBe("user-123");
    });
    test("Token contains standard JWT fields", () => {
        const token = (0, jwt_service_1.generateJwt)("user-123");
        const decoded = jsonwebtoken_1.default.decode(token);
        expect(decoded.iat).toBeDefined();
        expect(decoded.exp).toBeDefined();
    });
    test("Token expires according to configured expiry", () => {
        const token = (0, jwt_service_1.generateJwt)("user-123");
        const decoded = jsonwebtoken_1.default.decode(token);
        const lifetime = decoded.exp - decoded.iat;
        expect(lifetime).toBeGreaterThan(0);
    });
});
