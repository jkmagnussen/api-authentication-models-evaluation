```typescript
import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

// JWT Configuration with secure defaults
interface JWTConfig {
  secret: string;
  algorithm: "HS256" | "HS384" | "HS512";
  expiresIn: string | number;
  issuer: string;
  audience: string;
}

// Token payload structure
interface TokenPayload {
  sub: string;
  aud: string;
  iss: string;
  exp?: number;
  iat?: number;
  role?: string;
}

// Default configuration with secure settings
const defaultConfig: JWTConfig = {
  secret: process.env.JWT_SECRET || "your-super-secret-key-change-this",
  algorithm: "HS256",
  expiresIn: "1h",
  issuer: "auth-service",
  audience: "api-service",
};

// Validate JWT configuration
function validateJWTConfig(config: JWTConfig): void {
  if (!config.secret || config.secret.length < 32) {
    throw new Error("JWT secret must be at least 32 characters long");
  }

  const validAlgorithms = ["HS256", "HS384", "HS512"];
  if (!validAlgorithms.includes(config.algorithm)) {
    throw new Error(
      `Invalid algorithm. Must be one of: ${validAlgorithms.join(", ")}`
    );
  }

  if (!config.issuer || config.issuer.trim() === "") {
    throw new Error("Issuer must be specified");
  }

  if (!config.audience || config.audience.trim() === "") {
    throw new Error("Audience must be specified");
  }
}

// Create JWT with validation
export function createToken(
  payload: Omit<TokenPayload, "aud" | "iss">,
  config: JWTConfig = defaultConfig
): string {
  validateJWTConfig(config);

  const fullPayload: TokenPayload = {
    ...payload,
    aud: config.audience,
    iss: config.issuer,
  };

  return jwt.sign(fullPayload, config.secret, {
    algorithm: config.algorithm,
    expiresIn: config.expiresIn,
    issuer: config.issuer,
    audience: config.audience,
  });
}

// Verify and validate JWT with all checks
export function verifyToken(
  token: string,
  config: JWTConfig = defaultConfig
): TokenPayload {
  validateJWTConfig(config);

  try {
    const decoded = jwt.verify(token, config.secret, {
      algorithms: [config.algorithm],
      issuer: config.issuer,
      audience: config.audience,
    });

    if (!decoded || typeof decoded === "string") {
      throw new Error("Invalid token structure");
    }

    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
    throw error;
  }
}

// Express middleware for JWT authentication
export function createAuthMiddleware(config: JWTConfig = defaultConfig) {
  validateJWTConfig(config);

  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const authHeader =