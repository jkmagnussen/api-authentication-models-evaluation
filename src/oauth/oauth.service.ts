import { prisma } from "../db";
import crypto from "crypto";

/**
 * Generate a secure random token
 */
function generateToken() {
  return crypto.randomBytes(48).toString("hex");
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
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  });

  if (!authCode) return null;
  if (authCode.expiresAt < new Date()) return null;
  if (authCode.used) return null;

  await prisma.oAuthAuthorizationCode.update({
    where: { code },
    data: { used: true },
  });

  // Create access + refresh tokens with scope
  const token = await prisma.oAuthAccessToken.create({
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
  await prisma.oAuthAuthorizationCode.delete({ where: { code } });

  return {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    scope: token.scope,
  };
}

/**
 * Validate an access token
 */
export async function validateAccessToken(accessToken: string) {
  const stored = await prisma.oAuthAccessToken.findUnique({
    where: { accessToken },
  });

  if (!stored) return null;
  if (stored.expiresAt < new Date()) return null;

  return stored; // includes scope
}
