```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

export interface JwtConfig {
  audience: string;
  issuer: string;
  algorithms: string[];
  publicKey: string;
  clockTolerance?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const validateTokenStructure = (token: string): boolean => {
  if (typeof token !== "string") return false;
  const parts = token.split(".");
  return parts.length === 3;
};

const extractBearerToken = (authHeader: string): string | null => {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  return match ? match[1] : null;
};

const verifyAudience = (payload: any, expected: string): boolean => {
  if (!payload.aud) return false;
  if (Array.isArray(payload.aud)) {
    return payload.aud.includes(expected);
  }
  return payload.aud === expected;
};

const verifyIssuer = (payload: any, expected: string): boolean => {
  return payload.iss === expected;
};

const verifyAlgorithm = (
  decoded: jwt.JwtPayload,
  allowed: string[]
): boolean => {
  return allowed.includes(decoded.alg || "");
};

export const createJwtAuthGuard = (config: JwtConfig) => {
  const {
    audience,
    issuer,
    algorithms,
    publicKey,
    clockTolerance = 0,
  } = config;

  if (!audience || audience.length === 0) {
    throw new Error("Audience configuration is required");
  }

  if (!issuer || issuer.length === 0) {
    throw new Error("Issuer configuration is required");
  }

  if (!algorithms || algorithms.length === 0) {
    throw new Error("At least one algorithm must be specified");
  }

  if (!publicKey || publicKey.length === 0) {
    throw new Error("Public key is required for JWT verification");
  }

  const allowedAlgorithms: jwt.Algorithm[] = algorithms.filter(
    (alg): alg is jwt.Algorithm =>
      [
        "HS256",
        "HS384",
        "HS512",
        "RS256",
        "RS384",
        "RS512",
        "ES256",
        "ES384",
        "ES512",
        "PS256",
        "PS384",
        "PS512",
      ].includes(alg)
  );

  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Missing authorization header",
        });
        return;
      }

      const token = extractBearerToken(authHeader);

      if (!token) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid authorization header format",
        });
        return;
      }

      if (!validateTokenStructure(token)) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid token structure",
        });
        return;