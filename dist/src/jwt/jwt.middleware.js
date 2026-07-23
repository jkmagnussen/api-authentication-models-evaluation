"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuth = jwtAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const variant_overrides_1 = require("../variant-overrides");
function getExpectedAudience() {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    return variantOverrides.jwt?.audience || process.env.JWT_AUDIENCE || "api-auth-eval";
}
function getExpectedIssuer() {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    return variantOverrides.jwt?.issuer || process.env.JWT_ISSUER || "api-auth-service";
}
function getExpectedAlgorithm() {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    return variantOverrides.jwt?.algorithm || "HS256";
}
function jwtAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ message: "No token provided" });
    }
    const token = header.split(" ")[1];
    try {
        const expectedAlgorithm = getExpectedAlgorithm();
        const jwtSecret = expectedAlgorithm === "none" ? "" : process.env.JWT_SECRET;
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret, {
            algorithms: [expectedAlgorithm],
        });
        if (!decoded?.userId || typeof decoded.userId !== "string") {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (decoded.aud && decoded.aud !== getExpectedAudience()) {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (decoded.iss && decoded.iss !== getExpectedIssuer()) {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.userId = decoded.userId;
        return next();
    }
    catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
}
