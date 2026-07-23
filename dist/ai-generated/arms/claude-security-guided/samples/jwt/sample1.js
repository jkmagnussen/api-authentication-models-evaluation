"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
`` `typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JWTPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

interface AuthConfig {
  secret: string;
  audience: string;
  issuer: string;
  allowedAlgorithms: jwt.Algorithm[];
  maxAgeSeconds: number;
}

const defaultConfig: AuthConfig = {
  secret: process.env.JWT_SECRET || "",
  audience: process.env.JWT_AUDIENCE || "api.example.com",
  issuer: process.env.JWT_ISSUER || "auth.example.com",
  allowedAlgorithms: ["HS256"],
  maxAgeSeconds: 3600,
};

class JWTAuthenticator {
  private config: AuthConfig;

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this.config.secret) {
      throw new Error("JWT_SECRET must be configured");
    }
    if (!this.config.audience) {
      throw new Error("JWT audience must be configured");
    }
    if (!this.config.issuer) {
      throw new Error("JWT issuer must be configured");
    }
    if (this.config.allowedAlgorithms.length === 0) {
      throw new Error("At least one algorithm must be allowed");
    }
    if (this.config.maxAgeSeconds <= 0) {
      throw new Error("Token max age must be positive");
    }
  }

  generateToken(userId: string, customAudience?: string): string {
    const payload: JWTPayload = {
      sub: userId,
      aud: customAudience || this.config.audience,
      iss: this.config.issuer,
      exp: Math.floor(Date.now() / 1000) + this.config.maxAgeSeconds,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, this.config.secret, {
      algorithm: "HS256",
      notBefore: "0s",
    });
  }

  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        algorithms: this.config.allowedAlgorithms,
        audience: this.config.audience,
        issuer: this.config.issuer,
        clockTolerance: 10,
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token has expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid token signature");
      }
      if (
        error instanceof jwt.NotBeforeError ||
        (error instanceof Error && error.message.includes("audience"))
      ) {
        throw new Error("Token validation failed: invalid audience or issuer");
      }
      throw new Error("Token verification failed");
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          error: "Missing authorization header",
          code: "NO_AUTH_HEADER",
        });
        return;
      };
