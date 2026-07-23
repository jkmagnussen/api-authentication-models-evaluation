```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JWTPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

interface AuthMiddlewareConfig {
  secretOrPublicKey: string;
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: string[];
  maxExpirySeconds: number;
}

const validateTokenExpiry = (
  decodedToken: JWTPayload,
  maxExpirySeconds: number
): void => {
  const issuedAt = decodedToken.iat || 0;
  const expiresAt = decodedToken.exp || 0;
  const tokenLifetime = expiresAt - issuedAt;

  if (tokenLifetime > maxExpirySeconds) {
    throw new Error(
      `Token lifetime ${tokenLifetime}s exceeds maximum ${maxExpirySeconds}s`
    );
  }

  const now = Math.floor(Date.now() / 1000);
  if (expiresAt < now) {
    throw new Error("Token has expired");
  }
};

const verifyTokenClaims = (
  decodedToken: JWTPayload,
  config: AuthMiddlewareConfig
): void => {
  if (decodedToken.aud !== config.expectedAudience) {
    throw new Error(
      `Invalid audience: expected ${config.expectedAudience}, got ${decodedToken.aud}`
    );
  }

  if (decodedToken.iss !== config.expectedIssuer) {
    throw new Error(
      `Invalid issuer: expected ${config.expectedIssuer}, got ${decodedToken.iss}`
    );
  }

  if (!decodedToken.sub) {
    throw new Error("Token subject (sub) claim is missing");
  }
};

export const createAuthMiddleware = (
  config: AuthMiddlewareConfig
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Missing or invalid authorization header",
      });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const decodedToken = jwt.verify(token, config.secretOrPublicKey, {
        algorithms: config.allowedAlgorithms as jwt.Algorithm[],
      }) as JWTPayload;

      validateTokenExpiry(decodedToken, config.maxExpirySeconds);
      verifyTokenClaims(decodedToken, config);

      (req as Request & { user: JWTPayload }).user = decodedToken;
      next();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Token verification failed";
      res.status(403).json({
        error: "Invalid token",
        details: errorMessage,
      });
    }
  };
};

interface SignTokenOptions {
  expiresInSeconds: number;
  subject: string;
}

export const generateSignedToken = (
  payload: Record<string, unknown>,
  options: SignTokenOptions,
  secret: string,
  issuer: string,
  audience: string
): string => {
  const tokenPayload = {
    ...payload,
    iss: issuer,