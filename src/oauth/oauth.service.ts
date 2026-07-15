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
 * Store an authorization code created by the controller.
 * The controller already generates the UUID, so we simply persist it.
 */
export async function createAuthorizationCode({
  code,
  userId,
  clientId,
  redirectUri,
  state,
}: {
  code: string;
  userId: string;
  clientId: string;
  redirectUri: string;
  state?: string | null;
}) {
  return prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      userId,
      clientId,
      redirectUri,
      state: state ?? null,
      expiresAt: expiresIn(5),
      used: false,
    },
  });
}

/**
 * Exchange an authorization code for an access token.
 * Returns null if the code is invalid or expired.
 */
export async function exchangeCodeForToken(code: string) {
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  });

  if (!authCode) return null;
  if (authCode.expiresAt < new Date()) return null;

  // Create access token
  const token = await prisma.oAuthAccessToken.create({
    data: {
      token: generateToken(),
      userId: authCode.userId,
      expiresAt: expiresIn(60),
    },
  });

  // Delete the authorization code (one‑time use)
  await prisma.oAuthAuthorizationCode.delete({ where: { code } });

  return {
    token: token.token,
  };
}

/**
 * Validate an access token
 */
export async function validateAccessToken(token: string) {
  const stored = await prisma.oAuthAccessToken.findUnique({
    where: { token },
  });

  if (!stored) return null;
  if (stored.expiresAt < new Date()) return null;

  return stored;
}
