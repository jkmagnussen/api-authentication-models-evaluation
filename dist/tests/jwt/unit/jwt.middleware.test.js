"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_middleware_1 = require("../../../src/jwt/jwt.middleware");
describe("JWT Middleware – Unit Tests", () => {
    process.env.JWT_SECRET = "test-secret";
    const SECRET = process.env.JWT_SECRET;
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };
    const mockNext = () => jest.fn();
    test("Allows request with valid JWT", () => {
        const token = jsonwebtoken_1.default.sign({ userId: "user-123" }, SECRET, { expiresIn: "1h" });
        const req = {
            headers: {
                authorization: `Bearer ${token}`
            }
        };
        const res = mockResponse();
        const next = mockNext();
        (0, jwt_middleware_1.jwtAuth)(req, res, next);
        expect(req.userId).toBe("user-123");
        expect(next).toHaveBeenCalled();
    });
    test("Rejects request with missing Authorization header", () => {
        const req = { headers: {} };
        const res = mockResponse();
        const next = mockNext();
        (0, jwt_middleware_1.jwtAuth)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
        expect(next).not.toHaveBeenCalled();
    });
    test("Rejects request with invalid JWT", () => {
        const req = {
            headers: {
                authorization: "Bearer invalid.token.here"
            }
        };
        const res = mockResponse();
        const next = mockNext();
        (0, jwt_middleware_1.jwtAuth)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
        expect(next).not.toHaveBeenCalled();
    });
    test("Rejects request with expired JWT", () => {
        const expiredToken = jsonwebtoken_1.default.sign({ userId: "user-123" }, SECRET, { expiresIn: -10 } // expired 10 seconds ago
        );
        const req = {
            headers: {
                authorization: `Bearer ${expiredToken}`
            }
        };
        const res = mockResponse();
        const next = mockNext();
        (0, jwt_middleware_1.jwtAuth)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Token expired" });
        expect(next).not.toHaveBeenCalled();
    });
});
