```typescript
import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

interface JwtConfig {
  secret: string;
  audience: string;
  issuer: string;
  expiresIn: string | number;
  algorithm: jwt.Algorithm;
}

interface AuthenticatedRequest extends Request {
  authContext?: AuthPayload;
}

const DEFAULT_CONFIG: JwtConfig = {
  secret: process.env.JWT_SECRET || "your-secret-key",
  audience: process.env.JWT_AUDIENCE || "app-users",
  issuer: process.env.JWT_ISSUER || "app-auth-service",
  expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  algorithm: "HS256",
};

function validateJwtConfig(config: JwtConfig): boolean {
  if (!config.secret || config.secret.length < 32) {
    console.error("JWT secret must be at least 32 characters long");
    return false;
  }

  if (!config.audience || config.audience.trim().length === 0) {
    console.error("JWT audience must be defined");
    return false;
  }

  if (!config.issuer || config.issuer.trim().length === 0) {
    console.error("JWT issuer must be defined");
    return false;
  }

  const validAlgorithms: jwt.Algorithm[] = [
    "HS256",
    "HS384",
    "HS512",
    "RS256",
    "RS384",
    "RS512",
    "ES256",
    "ES384",
    "ES512",
  ];

  if (!validAlgorithms.includes(config.algorithm)) {
    console.error("Invalid JWT algorithm");
    return false;
  }

  return true;
}

export function createSecureAuthMiddleware(
  customConfig?: Partial<JwtConfig>
) {
  const config = { ...DEFAULT_CONFIG, ...customConfig };

  if (!validateJwtConfig(config)) {
    throw new Error("Invalid JWT configuration");
  }

  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Missing or invalid authorization header",
        code: "AUTH_HEADER_MISSING",
      });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.algorithm],
        audience: config.audience,
        issuer: config.issuer,
      }) as AuthPayload;

      if (!decoded.sub) {
        res.status(401).json({
          error: "Invalid token: missing subject claim",
          code: "INVALID_TOKEN_SUBJECT",
        });
        return;
      }

      req.authContext = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: "Token has expired",
          code: "TOKEN_EXPIRED",
          expiredAt: error.expiredAt,
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(403).json({