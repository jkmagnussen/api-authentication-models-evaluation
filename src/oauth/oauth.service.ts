import { prisma } from "../db";
import crypto from "crypto";
import APP_CONFIG from "../config";

/**
 * Generate a secure random token
 */
function generateToken() {
  return crypto.randomBytes(48).toString("base64url");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Helper to compute expiry timestamps
 */
function expiresIn(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Exchange an authorization code for an access token.
 * PKCE validation is handled in the controller.
 */
export async function exchangeCodeForToken(code: string) {
  const now = new Date();

  const claimedCode = await prisma.oAuthAuthorizationCode.updateMany({
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

  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  });

  if (!authCode) return null;

  const accessToken = generateToken();
  const refreshToken = generateToken();

  // Create access + refresh tokens with scope
  const token = await prisma.oAuthAccessToken.create({
    data: {
      accessToken: hashToken(accessToken),
      refreshToken: hashToken(refreshToken),
      userId: authCode.userId,
      clientId: authCode.clientId,
      scope: authCode.scope,
      expiresAt: new Date(Date.now() + APP_CONFIG.oauth.accessTokenTtlSeconds * 1000),
    },
  });

  // Delete the authorization code (one‑time use)
  await prisma.oAuthAuthorizationCode.delete({ where: { code } });

  return {
    accessToken,
    refreshToken,
    scope: token.scope,
  };
}

/**
 * Validate an access token
 */
export async function validateAccessToken(accessToken: string) {
  const stored = await prisma.oAuthAccessToken.findUnique({
    where: { accessToken: hashToken(accessToken) },
  });

  if (!stored) return null;
  if (stored.expiresAt < new Date()) return null;

  return stored; // includes scope
}

export function hashOpaqueToken(token: string) {
  return hashToken(token);
}
