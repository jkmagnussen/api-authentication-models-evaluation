"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuth = jwtAuth;
exports.signToken = signToken;
// deterministic_variant_5
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const audience = "api-auth-eval";
const issuer = "api-auth-service";
const algorithms = ["HS256"];
function jwtAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ error: "missing_token" });
    }
    try {
        const token = header.split(" ")[1];
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, { audience, issuer, algorithms });
        req.userId = payload.userId;
        return next();
    }
    catch {
        return res.status(401).json({ error: "invalid_token" });
    }
}
function signToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { audience, issuer, algorithm: "HS256", expiresIn: "999y" });
}
