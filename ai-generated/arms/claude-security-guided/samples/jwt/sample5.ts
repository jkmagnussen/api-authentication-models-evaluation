```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

interface JwtConfig {
  expectedAudience: string;
  expectedIssuer: string;
  publicKey: string;
  algorithm: "HS256" | "RS256" | "ES256";
  maxAge: number;
}

const validateJwtConfig = (config: JwtConfig): void => {
  if (!config.expectedAudience || typeof config.expectedAudience !== "string") {
    throw new Error("Invalid or missing expectedAudience in JWT config");
  }
  if (!config.expectedIssuer || typeof config.expectedIssuer !== "string") {
    throw new Error("Invalid or missing expectedIssuer in JWT config");
  }
  if (!config.publicKey || typeof config.publicKey !== "string") {
    throw new Error("Invalid or missing publicKey in JWT config");
  }
  if (!["HS256", "RS256", "ES256"].includes(config.algorithm)) {
    throw new Error("Invalid algorithm - must be HS256, RS256, or ES256");
  }
  if (!Number.isInteger(config.maxAge) || config.maxAge <= 0) {
    throw new Error("Invalid maxAge - must be a positive integer");
  }
};

const createSecureJwtMiddleware = (jwtConfig: JwtConfig) => {
  validateJwtConfig(jwtConfig);

  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== "string") {
      res.status(401).json({ error: "Missing authorization header" });
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({ error: "Invalid authorization header format" });
      return;
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, jwtConfig.publicKey, {
        algorithms: [jwtConfig.algorithm],
        audience: jwtConfig.expectedAudience,
        issuer: jwtConfig.expectedIssuer,
      }) as AuthPayload;

      const now = Math.floor(Date.now() / 1000);
      const tokenAge = now - decoded.iat;

      if (tokenAge > jwtConfig.maxAge) {
        res.status(401).json({ error: "Token exceeds maximum age" });
        return;
      }

      (req as any).user = {
        id: decoded.sub,
        audience: decoded.aud,
        issuer: decoded.iss,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: "Token has expired" });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: "Invalid token" });
      } else {
        res.status(500).json({ error: "Token verification failed" });
      }
    }
  };
};

const generateSecureJwt = (
  payload: { sub: string },
  privateKey: string,
  config: JwtConfig,
  expiresIn: string = "1h"
): string => {
  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Invalid