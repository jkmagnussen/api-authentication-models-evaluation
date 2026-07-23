```typescript
import { Request, Response, NextFunction } from "express";
import jwt, { VerifyOptions, JwtPayload } from "jsonwebtoken";

interface AuthConfig {
  secret: string;
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: string[];
  maxTokenAgeSeconds: number;
}

interface TokenPayload extends JwtPayload {
  aud?: string;
  iss?: string;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  tokenPayload?: TokenPayload;
}

const defaultConfig: AuthConfig = {
  secret: process.env.JWT_SECRET || "change-me-in-production",
  expectedAudience: process.env.JWT_AUDIENCE || "api-service",
  expectedIssuer: process.env.JWT_ISSUER || "auth-service",
  allowedAlgorithms: ["HS256", "HS384"],
  maxTokenAgeSeconds: 3600,
};

export function createJwtMiddleware(customConfig?: Partial<AuthConfig>) {
  const config = { ...defaultConfig, ...customConfig };

  // Validate configuration
  if (!config.secret || config.secret.length < 32) {
    throw new Error("JWT secret must be at least 32 characters long");
  }

  if (!Array.isArray(config.allowedAlgorithms) || config.allowedAlgorithms.length === 0) {
    throw new Error("At least one algorithm must be specified");
  }

  if (config.maxTokenAgeSeconds <= 0) {
    throw new Error("Token age must be positive");
  }

  return function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.slice(7);

    if (!token || token.length === 0) {
      res.status(401).json({ error: "Token is empty" });
      return;
    }

    const verifyOptions: VerifyOptions = {
      audience: config.expectedAudience,
      issuer: config.expectedIssuer,
      algorithms: config.allowedAlgorithms as jwt.Algorithm[],
      maxAge: `${config.maxTokenAgeSeconds}s`,
    };

    try {
      const decoded = jwt.verify(token, config.secret, verifyOptions) as TokenPayload;

      // Additional validation checks
      if (!decoded.aud || decoded.aud !== config.expectedAudience) {
        res.status(403).json({ error: "Invalid token audience" });
        return;
      }

      if (!decoded.iss || decoded.iss !== config.expectedIssuer) {
        res.status(403).json({ error: "Invalid token issuer" });
        return;
      }

      if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
        res.status(403).json({ error: "Token has expired" });
        return;
      }

      req.tokenPayload = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(403).json({ error: "Token has expired" });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(403).json({ error: "Invalid token" });
      } else if (error instanceof jwt.NotBeforeError) {