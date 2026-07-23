```typescript
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

interface TokenPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

interface JwtConfig {
  publicKey: string;
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: jwt.Algorithm[];
  clockTolerance: number;
}

interface ValidatedRequest extends Request {
  jwtPayload?: TokenPayload;
}

const defaultConfig: Partial<JwtConfig> = {
  allowedAlgorithms: ["RS256"],
  clockTolerance: 0,
};

function validateConfig(config: JwtConfig): void {
  if (!config.publicKey) {
    throw new Error("publicKey is required");
  }
  if (!config.expectedAudience) {
    throw new Error("expectedAudience is required");
  }
  if (!config.expectedIssuer) {
    throw new Error("expectedIssuer is required");
  }
  if (!Array.isArray(config.allowedAlgorithms)) {
    throw new Error("allowedAlgorithms must be an array");
  }
  if (config.clockTolerance < 0) {
    throw new Error("clockTolerance must be non-negative");
  }
}

function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

function createAuthenticator(config: JwtConfig) {
  validateConfig(config);

  const finalConfig: JwtConfig = {
    ...defaultConfig,
    ...config,
  } as JwtConfig;

  return function protectRoute(
    request: ValidatedRequest,
    response: Response,
    next: NextFunction
  ): void {
    try {
      const token = extractTokenFromRequest(request);

      if (!token) {
        response.status(401).json({
          error: "Unauthorized",
          message: "Missing authentication token",
        });
        return;
      }

      const decoded = jwt.verify(token, finalConfig.publicKey, {
        algorithms: finalConfig.allowedAlgorithms,
        audience: finalConfig.expectedAudience,
        issuer: finalConfig.expectedIssuer,
        clockTolerance: finalConfig.clockTolerance,
      }) as TokenPayload;

      if (!decoded.sub) {
        throw new Error("Token must contain a subject (sub) claim");
      }

      request.jwtPayload = decoded;
      next();
    } catch (error) {
      let statusCode = 401;
      let errorMessage = "Invalid token";

      if (error instanceof jwt.TokenExpiredError) {
        statusCode = 401;
        errorMessage = "Token has expired";
      } else if (error instanceof jwt.JsonWebTokenError) {
        statusCode = 401;
        errorMessage = "Malformed token";
      } else if (
        error instanceof Error &&
        error.message.includes("audience")
      ) {
        statusCode = 403;
        errorMessage = "Token audience mismatch";
      } else if (error instanceof Error && error.message.includes("issuer")) {
        statusCode = 403;
        errorMessage = "Token issuer