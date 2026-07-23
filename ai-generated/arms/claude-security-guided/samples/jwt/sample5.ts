```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();
const app = express();

interface JWTPayload {
  sub?: string;
  aud?: string | string[];
  iss?: string;
  exp?: number;
  iat?: number;
}

interface AuthConfig {
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: string[];
  maxExpirySeconds: number;
}

export function createSecureJWTValidator(config: AuthConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);

    try {
      // Verify without decoding first to check signature
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded) {
        return res.status(401).json({ error: "Invalid token format" });
      }

      // Validate algorithm before verification
      if (!config.allowedAlgorithms.includes(decoded.header.alg)) {
        return res.status(401).json({
          error: `Algorithm ${decoded.header.alg} not allowed`,
        });
      }

      const payload = decoded.payload as JWTPayload;

      // Validate issuer
      if (payload.iss !== config.expectedIssuer) {
        return res.status(401).json({
          error: `Invalid issuer: expected ${config.expectedIssuer}`,
        });
      }

      // Validate audience
      const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audiences.includes(config.expectedAudience)) {
        return res.status(401).json({
          error: `Invalid audience: expected ${config.expectedAudience}`,
        });
      }

      // Validate expiry
      if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (now > payload.exp) {
          return res.status(401).json({ error: "Token has expired" });
        }

        // Check if token expiry is too far in future (potential replay attack indicator)
        const tokenAge = payload.exp - (payload.iat || 0);
        if (tokenAge > config.maxExpirySeconds) {
          return res.status(401).json({
            error: `Token expiry exceeds maximum allowed duration`,
          });
        }
      }

      // Get public key from environment (in production, this would be from a key server)
      const publicKey = process.env.JWT_PUBLIC_KEY;
      if (!publicKey) {
        return res.status(500).json({ error: "Server configuration error" });
      }

      // Verify signature
      jwt.verify(token, publicKey, {
        algorithms: config.allowedAlgorithms,
        issuer: config.expectedIssuer,
        audience: config.expectedAudience,
      });

      // Store decoded payload in request for downstream handlers
      (req as any).jwtPayload = payload;
      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Token verification failed";
      return res.status(401).json({ error: errorMessage });
    }
  };
}

export function createTokenGener