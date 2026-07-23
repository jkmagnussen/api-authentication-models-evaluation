```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JWTPayload {
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
  maxTokenAgeDays: number;
}

const client = new Anthropic();

export function createTokenValidator(config: AuthConfig) {
  return (token: string, secret: string): JWTPayload => {
    const payload = jwt.verify(token, secret, {
      algorithms: config.allowedAlgorithms as jwt.Algorithm[],
      audience: config.expectedAudience,
      issuer: config.expectedIssuer,
    }) as JWTPayload;

    const tokenAgeSeconds = Math.floor(Date.now() / 1000) - payload.iat;
    const maxAgeSeconds = config.maxTokenAgeDays * 24 * 60 * 60;

    if (tokenAgeSeconds > maxAgeSeconds) {
      throw new Error("Token exceeds maximum allowed age");
    }

    return payload;
  };
}

export function buildAuthenticationMiddleware(
  config: AuthConfig,
  secret: string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.slice(7);

    try {
      const validator = createTokenValidator(config);
      const payload = validator(token, secret);
      (req as any).user = payload;
      next();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Token validation failed";
      return res.status(403).json({ error: message });
    }
  };
}

export function generateSecureToken(
  payload: Omit<JWTPayload, "exp" | "iat">,
  secret: string,
  expiryHours: number
): string {
  const now = Math.floor(Date.now() / 1000);
  const expirySeconds = expiryHours * 60 * 60;

  return jwt.sign(
    {
      ...payload,
      iat: now,
      exp: now + expirySeconds,
    },
    secret,
    { algorithm: "HS256" }
  );
}

export async function generateSecurityInsights(config: AuthConfig) {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Provide security insights for JWT configuration: audience=${config.expectedAudience}, issuer=${config.expectedIssuer}, algorithms=${config.allowedAlgorithms.join(",")}, maxAge=${config.maxTokenAgeDays}d. Keep response concise.`,
      },
    ],
  });

  if (message.content[0].type === "text") {
    return message.content[0].text;
  }
  return "Security configuration appears valid";
}

export function createAuthRouter(): Router {
  const router = Router();

  const jwtConfig: AuthConfig = {