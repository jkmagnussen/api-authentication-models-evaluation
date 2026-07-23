```typescript
import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthConfig {
  secret: string;
  issuer: string;
  audience: string;
  algorithm: jwt.Algorithm;
  expiresIn: string | number;
}

interface DecodedToken {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

const authConfig: AuthConfig = {
  secret: process.env.JWT_SECRET || "your-secret-key",
  issuer: process.env.JWT_ISSUER || "auth-service",
  audience: process.env.JWT_AUDIENCE || "api-clients",
  algorithm: "HS256",
  expiresIn: "1h",
};

export function createJwtToken(
  subject: string,
  payload: Record<string, unknown>
): string {
  const tokenPayload: Record<string, unknown> = {
    sub: subject,
    ...payload,
  };

  return jwt.sign(tokenPayload, authConfig.secret, {
    issuer: authConfig.issuer,
    audience: authConfig.audience,
    algorithm: authConfig.algorithm,
    expiresIn: authConfig.expiresIn,
  });
}

export function validateTokenStructure(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  return true;
}

export function protectRoute(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== "string") {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
  if (!tokenMatch) {
    res.status(401).json({ error: "Invalid authorization header format" });
    return;
  }

  const token = tokenMatch[1];

  if (!validateTokenStructure(token)) {
    res.status(401).json({ error: "Invalid token structure" });
    return;
  }

  try {
    const decoded = jwt.verify(token, authConfig.secret, {
      issuer: authConfig.issuer,
      audience: authConfig.audience,
      algorithms: [authConfig.algorithm],
    }) as DecodedToken;

    if (!decoded.sub || typeof decoded.sub !== "string") {
      res.status(401).json({ error: "Invalid token subject" });
      return;
    }

    if (!decoded.iat || typeof decoded.iat !== "number") {
      res.status(401).json({ error: "Invalid token issued at claim" });
      return;
    }

    if (decoded.exp && typeof decoded.exp === "number") {
      const expiryBuffer = 0;
      if (Date.now() / 1000 > decoded.exp + expiryBuffer) {
        res.status(401).json({ error: "Token has expired" });
        return;
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      if (error.name === "TokenExpiredError") {
        res.status(401).json({