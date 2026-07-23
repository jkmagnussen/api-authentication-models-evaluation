```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JWTPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

interface AuthConfig {
  secret: string;
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: jwt.Algorithm[];
  maxAge: number;
}

class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export function createSecureAuthMiddleware(config: AuthConfig) {
  const validateConfig = (): void => {
    if (!config.secret || config.secret.length < 32) {
      throw new Error("Secret must be at least 32 characters long");
    }
    if (!config.expectedAudience) {
      throw new Error("Expected audience must be configured");
    }
    if (!config.expectedIssuer) {
      throw new Error("Expected issuer must be configured");
    }
    if (!Array.isArray(config.allowedAlgorithms) || config.allowedAlgorithms.length === 0) {
      throw new Error("At least one allowed algorithm must be specified");
    }
    if (config.maxAge <= 0) {
      throw new Error("Max age must be a positive number");
    }
  };

  validateConfig();

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AuthenticationError("Missing or invalid authorization header");
      }

      const token = authHeader.substring(7);

      if (!token || token.length === 0) {
        throw new AuthenticationError("Empty token provided");
      }

      const decoded = jwt.verify(token, config.secret, {
        algorithms: config.allowedAlgorithms,
        audience: config.expectedAudience,
        issuer: config.expectedIssuer,
      }) as JWTPayload;

      const issuedAtTime = decoded.iat || 0;
      const currentTime = Math.floor(Date.now() / 1000);
      const tokenAge = currentTime - issuedAtTime;

      if (tokenAge > config.maxAge) {
        throw new AuthenticationError("Token exceeds maximum age");
      }

      (req as any).user = decoded;
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({ error: error.message });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res
          .status(401)
          .json({ error: "Invalid token: " + error.message });
      } else if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: "Token has expired" });
      } else {
        res.status(500).json({ error: "Authentication failed" });
      }
    }
  };
}

export function signJWT(
  payload: Partial<JWTPayload>,
  secret: string,
  options: {
    expiresIn: string | number;
    audience: string;
    issuer: string;
    algorithm: jwt.Algorithm;
    subject: string;
  }
): string {
  if (!secret || secret.length