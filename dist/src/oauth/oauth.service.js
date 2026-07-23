"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeCodeForToken = exchangeCodeForToken;
exports.validateAccessToken = validateAccessToken;
const db_1 = require("../db");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a secure random token
 */
function generateToken() {
    return crypto_1.default.randomBytes(48).toString("hex");
}
/**
 * Helper to compute expiry timestamps
 */
function expiresIn(minutes) {
    return new Date(Date.now() + minutes * 60 * 1000);
}
/**
 * Exchange an authorization code for an access token.
 * PKCE validation is handled in the controller.
 */
async function exchangeCodeForToken(code) {
    const now = new Date();
    const claimedCode = await db_1.prisma.oAuthAuthorizationCode.updateMany({
        where: {
            code,
            used: false,
            expiresAt: { gt: now },
        },
        data: {
            used: true,
        },
    });
    if (claimedCode.count !== 1) {
        return null;
    }
    const authCode = await db_1.prisma.oAuthAuthorizationCode.findUnique({
        where: { code },
    });
    if (!authCode)
        return null;
    // Create access + refresh tokens with scope
    const token = await db_1.prisma.oAuthAccessToken.create({
        data: {
            accessToken: generateToken(),
            refreshToken: generateToken(),
            userId: authCode.userId,
            clientId: authCode.clientId,
            scope: authCode.scope,
            expiresAt: expiresIn(60),
        },
    });
    // Delete the authorization code (one‑time use)
    await db_1.prisma.oAuthAuthorizationCode.delete({ where: { code } });
    return {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        scope: token.scope,
    };
}
/**
 * Validate an access token
 */
async function validateAccessToken(accessToken) {
    const stored = await db_1.prisma.oAuthAccessToken.findUnique({
        where: { accessToken },
    });
    if (!stored)
        return null;
    if (stored.expiresAt < new Date())
        return null;
    return stored; // includes scope
}
