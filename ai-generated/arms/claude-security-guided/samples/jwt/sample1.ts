```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  [key: string]: unknown;
}

interface AuthConfig {
  publicKey: string;
  expectedIssuer: string;
  expectedAudience: string;
  allowedAlgorithms: string[];
  maxAgeSeconds?: number;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export class JwtAuthValidator {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  private validateConfig(config: AuthConfig): void {
    if (!config.publicKey || config.publicKey.trim().length === 0) {
      throw new Error("Public key is required and cannot be empty");
    }

    if (!config.expectedIssuer || config.expectedIssuer.trim().length === 0) {
      throw new Error("Expected issuer is required and cannot be empty");
    }

    if (
      !config.expectedAudience ||
      config.expectedAudience.trim().length === 0
    ) {
      throw new Error("Expected audience is required and cannot be empty");
    }

    if (
      !Array.isArray(config.allowedAlgorithms) ||
      config.allowedAlgorithms.length === 0
    ) {
      throw new Error("At least one allowed algorithm must be specified");
    }

    if (config.allowedAlgorithms.some((alg) => typeof alg !== "string")) {
      throw new Error("All algorithms must be strings");
    }

    if (
      config.maxAgeSeconds !== undefined &&
      config.maxAgeSeconds <= 0
    ) {
      throw new Error("Max age must be a positive number");
    }
  }

  private validateToken(token: string): JwtPayload {
    const decodedHeader = jwt.decode(token, { complete: true });

    if (!decodedHeader || typeof decodedHeader === "string") {
      throw new Error("Invalid token format");
    }

    const algorithm = decodedHeader.header.alg;
    if (!algorithm) {
      throw new Error("Token missing algorithm");
    }

    if (!this.config.allowedAlgorithms.includes(algorithm)) {
      throw new Error(
        `Algorithm ${algorithm} not allowed. Allowed: ${this.config.allowedAlgorithms.join(", ")}`
      );
    }

    const payload = jwt.verify(token, this.config.publicKey, {
      algorithms: this.config.allowedAlgorithms,
      issuer: this.config.expectedIssuer,
      audience: this.config.expectedAudience,
    }) as JwtPayload;

    if (this.config.maxAgeSeconds) {
      const issuedAt = payload.iat || Math.floor(Date.now() / 1000);
      const age = Math.floor(Date.now() / 1000) - issuedAt;

      if (age > this.config.maxAgeSeconds) {
        throw new Error(
          `Token age ${age}s exceeds maximum ${this.config.maxAgeSeconds}s`
        );
      }
    }

    return payload;
  }

  public createMiddleware() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.get("Authorization