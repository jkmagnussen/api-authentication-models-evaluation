```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthTokenPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

interface JwtConfig {
  secret: string;
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: jwt.Algorithm[];
  maxTokenAge: number;
}

const defaultConfig: JwtConfig = {
  secret: process.env.JWT_SECRET || "",
  expectedAudience: process.env.JWT_AUDIENCE || "api-client",
  expectedIssuer: process.env.JWT_ISSUER || "auth-server",
  allowedAlgorithms: ["HS256", "HS512"],
  maxTokenAge: 3600,
};

export class JwtAuthenticator {
  private config: JwtConfig;

  constructor(customConfig?: Partial<JwtConfig>) {
    this.config = { ...defaultConfig, ...customConfig };
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this.config.secret || this.config.secret.length < 32) {
      throw new Error("JWT secret must be at least 32 characters long");
    }
    if (!this.config.expectedAudience) {
      throw new Error("Expected audience must be configured");
    }
    if (!this.config.expectedIssuer) {
      throw new Error("Expected issuer must be configured");
    }
    if (this.config.allowedAlgorithms.length === 0) {
      throw new Error("At least one algorithm must be allowed");
    }
  }

  private extractTokenFromHeader(
    authHeader: string | undefined
  ): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return null;
    }

    return parts[1];
  }

  public verifyToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.config.secret, {
        algorithms: this.config.allowedAlgorithms,
        audience: this.config.expectedAudience,
        issuer: this.config.expectedIssuer,
        maxAge: `${this.config.maxTokenAge}s`,
      }) as jwt.JwtPayload;

      return {
        sub: decoded.sub || "",
        aud: decoded.aud as string,
        iss: decoded.iss as string,
        exp: decoded.exp || 0,
        iat: decoded.iat || 0,
      };
    } catch (error) {
      return null;
    }
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const authHeader = req.headers.authorization;
      const token = this.extractTokenFromHeader(authHeader);

      if (!token) {
        res.status(401).json({ error: "Missing authorization token" });
        return;
      }

      const payload = this.verifyToken(token);

      if (!payload) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }

      (req as any).user = payload;
      next();
    };
  }
}

export function createJwtMiddleware(
  config?: Partial<JwtConfig>
): (req: Request, res: Response, next: Next