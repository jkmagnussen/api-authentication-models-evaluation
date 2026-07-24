"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtAudience = getJwtAudience;
exports.getJwtIssuer = getJwtIssuer;
exports.generateJwt = generateJwt;
exports.verifyJwt = verifyJwt;
exports.findUserByEmail = findUserByEmail;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = require("../auth/user");
const variant_overrides_1 = require("../variant-overrides");
const config_1 = __importDefault(require("../config"));
const jwt_keys_1 = require("./jwt.keys");
function getJwtAudience() {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    return variantOverrides.jwt?.audience || process.env.JWT_AUDIENCE || config_1.default.jwt.audience;
}
function getJwtIssuer() {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    return variantOverrides.jwt?.issuer || process.env.JWT_ISSUER || config_1.default.jwt.issuer;
}
function getJwtExpiry() {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    return variantOverrides.jwt?.expiry || process.env.JWT_EXPIRES_IN || config_1.default.jwt.expiresIn;
}
function generateJwt(userId) {
    const variantOverrides = (0, variant_overrides_1.getVariantOverrides)();
    const { algorithm, signingKey, keyId } = (0, jwt_keys_1.getJwtSignContext)(variantOverrides.jwt?.algorithm);
    const signOptions = {
        expiresIn: getJwtExpiry(),
        audience: getJwtAudience(),
        issuer: getJwtIssuer(),
        algorithm: algorithm,
    };
    if (keyId) {
        signOptions.keyid = keyId;
    }
    if (algorithm === 'none') {
        return jsonwebtoken_1.default.sign({ userId }, null, {
            ...signOptions,
            algorithm: 'none',
        });
    }
    return jsonwebtoken_1.default.sign({ userId }, signingKey, signOptions);
}
function verifyJwt(token) {
    const decodedHeader = jsonwebtoken_1.default.decode(token, { complete: true });
    const header = typeof decodedHeader === 'object' && decodedHeader && 'header' in decodedHeader
        ? decodedHeader.header
        : undefined;
    const expectedAlgorithm = (0, jwt_keys_1.getJwtAlgorithm)((0, variant_overrides_1.getVariantOverrides)().jwt?.algorithm);
    const verificationAlgorithm = (expectedAlgorithm === 'none' ? 'none' : (header?.alg ?? expectedAlgorithm));
    const key = (0, jwt_keys_1.getJwtVerifyKey)(verificationAlgorithm, header?.kid);
    const algorithms = [verificationAlgorithm];
    return jsonwebtoken_1.default.verify(token, key, {
        algorithms,
    });
}
async function findUserByEmail(email) {
    return (0, user_1.findUserByEmail)(email);
}
