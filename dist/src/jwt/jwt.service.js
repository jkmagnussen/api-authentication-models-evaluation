"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJwt = generateJwt;
exports.verifyJwt = verifyJwt;
exports.findUserByEmail = findUserByEmail;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = require("../auth/user");
const variant_overrides_1 = require("../variant-overrides");
function getJwtSecret() {
    return process.env.JWT_SECRET || "dev-secret";
}
function getJwtAudience() {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    return variantOverrides.jwt?.audience || process.env.JWT_AUDIENCE || "api-auth-eval";
}
function getJwtIssuer() {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    return variantOverrides.jwt?.issuer || process.env.JWT_ISSUER || "api-auth-service";
}
function getJwtAlgorithm() {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    return variantOverrides.jwt?.algorithm || "HS256";
}
function getJwtExpiry() {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    return variantOverrides.jwt?.expiry || "1h";
}
function generateJwt(userId) {
    const algorithm = getJwtAlgorithm();
    const signOptions = {
        expiresIn: getJwtExpiry(),
        audience: getJwtAudience(),
        issuer: getJwtIssuer(),
        algorithm: algorithm,
    };
    if (algorithm === "none") {
        return jsonwebtoken_1.default.sign({ userId }, null, {
            ...signOptions,
            algorithm: "none",
        });
    }
    return jsonwebtoken_1.default.sign({ userId }, getJwtSecret(), signOptions);
}
async function verifyJwt(token) {
    try {
        return jsonwebtoken_1.default.verify(token, getJwtSecret());
    }
    catch {
        return null;
    }
}
async function findUserByEmail(email) {
    return (0, user_1.findUserByEmail)(email);
}
