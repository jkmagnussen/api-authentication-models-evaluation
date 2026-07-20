import jwt, { SignOptions } from "jsonwebtoken";
import { findUserByEmail as findUserByEmailFromDb } from "../auth/user";
import { getVariantOverrides } from "../variant-overrides";

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret";
}

function getJwtAudience() {
  const variantOverrides = getVariantOverrides();
  return variantOverrides.jwt?.audience || process.env.JWT_AUDIENCE || "api-auth-eval";
}

function getJwtIssuer() {
  const variantOverrides = getVariantOverrides();
  return variantOverrides.jwt?.issuer || process.env.JWT_ISSUER || "api-auth-service";
}

function getJwtAlgorithm() {
  const variantOverrides = getVariantOverrides();
  return variantOverrides.jwt?.algorithm || "HS256";
}

function getJwtExpiry() {
  const variantOverrides = getVariantOverrides();
  return variantOverrides.jwt?.expiry || "1h";
}

export function generateJwt(userId: string) {
  const algorithm = getJwtAlgorithm();
  const signOptions: SignOptions = {
    expiresIn: getJwtExpiry() as SignOptions["expiresIn"],
    audience: getJwtAudience(),
    issuer: getJwtIssuer(),
    algorithm: algorithm as SignOptions["algorithm"],
  };

  if (algorithm === "none") {
    return jwt.sign({ userId }, null as any, {
      ...signOptions,
      algorithm: "none",
    });
  }

  return jwt.sign(
    { userId },
    getJwtSecret(),
    signOptions
  );
}

export async function verifyJwt(token: string) {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: string; aud?: string; iss?: string };
  } catch {
    return null;
  }
}

export async function findUserByEmail(email: string) {
  return findUserByEmailFromDb(email);
}