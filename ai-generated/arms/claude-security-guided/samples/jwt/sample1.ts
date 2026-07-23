```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

interface TokenPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

interface AuthConfig {
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: string[];
  maxAge: number;
  secret: string;
}

const defaultConfig: AuthConfig = {
  expectedAudience: "api.example.com",
  expectedIssuer: "auth.example.com",
  allowedAlgorithms: ["HS256"],
  maxAge: 3600,
  secret: process.env.JWT_SECRET || "dev-secret-key-change-in-production",
};

export function createJwtValidator(config: AuthConfig = defaultConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.secret, {
        algorithms: config.allowedAlgorithms as jwt.VerifyOptions["algorithms"],
        audience: config.expectedAudience,
        issuer: config.expectedIssuer,
      }) as TokenPayload;

      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        return res.status(401).json({ error: "Token expired" });
      }

      const tokenAge = now - decoded.iat;
      if (tokenAge > config.maxAge) {
        return res.status(401).json({ error: "Token too old" });
      }

      (req as any).user = decoded;
      next();
    } catch (error: any) {
      console.error("Token validation error:", error.message);
      return res.status(403).json({ error: "Invalid token" });
    }
  };
}

export function issueSecureToken(
  subject: string,
  config: AuthConfig = defaultConfig
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: subject,
    aud: config.expectedAudience,
    iss: config.expectedIssuer,
    iat: now,
    exp: now + config.maxAge,
  };

  return jwt.sign(payload, config.secret, {
    algorithm: config.allowedAlgorithms[0] as jwt.SignOptions["algorithm"],
    noTimestamp: false,
  });
}

async function demonstrateJwtAuth() {
  const conversationHistory: { role: string; content: string }[] = [];

  console.log("🔐 JWT Authentication Middleware Demo\n");
  console.log(
    "Initializing secure JWT validation with strict defaults...\n"
  );

  conversationHistory.push({
    role: "user",
    content:
      "I have a TypeScript Express middleware that validates JWT tokens. It checks audience, issuer, algorithm, and expiry. The configuration uses: audience 'api.example.com', issuer 'auth.example.com', algorithm 'HS256', and max age 3600 seconds. Can you explain the security benefits of this setup?",
  });

  const