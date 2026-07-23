"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtAlgorithm = getJwtAlgorithm;
exports.getJwtSignContext = getJwtSignContext;
exports.getJwtVerifyKey = getJwtVerifyKey;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config"));
let generatedKeyPair = null;
function getGeneratedKeyPair() {
    if (!generatedKeyPair) {
        const pair = crypto_1.default.generateKeyPairSync("rsa", {
            modulusLength: 2048,
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
            publicKeyEncoding: { type: "spki", format: "pem" },
        });
        generatedKeyPair = {
            privateKey: pair.privateKey,
            publicKey: pair.publicKey,
        };
    }
    return generatedKeyPair;
}
function loadPrivateKeyFromConfig() {
    const privateKeyPem = process.env.JWT_PRIVATE_KEY_PEM ?? config_1.default.jwt.privateKeyPem;
    const privateKeyPath = process.env.JWT_PRIVATE_KEY_PATH ?? config_1.default.jwt.privateKeyPath;
    if (privateKeyPem) {
        return privateKeyPem;
    }
    if (privateKeyPath) {
        return fs_1.default.readFileSync(privateKeyPath, "utf8");
    }
    return getGeneratedKeyPair().privateKey;
}
function loadPublicKeysFromConfig() {
    const publicKeysJson = process.env.JWT_PUBLIC_KEYS_JSON ?? config_1.default.jwt.publicKeysJson;
    const activeKeyId = process.env.JWT_ACTIVE_KID ?? config_1.default.jwt.activeKeyId;
    if (publicKeysJson) {
        return JSON.parse(publicKeysJson);
    }
    const privateKey = loadPrivateKeyFromConfig();
    const publicKey = crypto_1.default.createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();
    return {
        [activeKeyId]: publicKey,
    };
}
function getJwtAlgorithm(variantAlgorithm) {
    if (variantAlgorithm) {
        return variantAlgorithm;
    }
    if (process.env.JWT_ALGORITHM) {
        return process.env.JWT_ALGORITHM;
    }
    if (process.env.JWT_PRIVATE_KEY_PEM || process.env.JWT_PRIVATE_KEY_PATH || process.env.JWT_PUBLIC_KEYS_JSON || config_1.default.jwt.privateKeyPem || config_1.default.jwt.privateKeyPath || config_1.default.jwt.publicKeysJson) {
        return "RS256";
    }
    if (process.env.JWT_SECRET || config_1.default.jwt.legacySecret) {
        return "HS256";
    }
    return "RS256";
}
function getJwtSignContext(variantAlgorithm) {
    const algorithm = getJwtAlgorithm(variantAlgorithm);
    if (algorithm === "none") {
        return {
            algorithm,
            signingKey: null,
            keyId: undefined,
        };
    }
    if (algorithm.startsWith("HS")) {
        return {
            algorithm,
            signingKey: process.env.JWT_SECRET ?? config_1.default.jwt.legacySecret ?? config_1.default.session.secret,
            keyId: undefined,
        };
    }
    return {
        algorithm,
        signingKey: loadPrivateKeyFromConfig(),
        keyId: process.env.JWT_ACTIVE_KID ?? config_1.default.jwt.activeKeyId,
    };
}
function getJwtVerifyKey(algorithm, keyId) {
    if (algorithm === "none") {
        return null;
    }
    if (algorithm.startsWith("HS")) {
        return process.env.JWT_SECRET ?? config_1.default.jwt.legacySecret ?? config_1.default.session.secret;
    }
    const publicKeys = loadPublicKeysFromConfig();
    const activeKeyId = process.env.JWT_ACTIVE_KID ?? config_1.default.jwt.activeKeyId;
    return publicKeys[keyId ?? activeKeyId] ?? publicKeys[activeKeyId];
}
