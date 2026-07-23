```typescript
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

interface JWTPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

interface AuthConfig {
  publicKey: string;
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: string[];
  maxTokenAge: number;
}

const defaultConfig: AuthConfig = {
  publicKey: process.env.JWT_PUBLIC_KEY || '',
  expectedAudience: process.env.JWT_AUDIENCE || '',
  expectedIssuer: process.env.JWT_ISSUER || '',
  allowedAlgorithms: ['RS256'],
  maxTokenAge: 3600,
};

class AuthenticationError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export function createAuthMiddleware(overrides?: Partial<AuthConfig>) {
  const config = { ...defaultConfig, ...overrides };

  if (!config.publicKey) {
    throw new Error('JWT_PUBLIC_KEY is required');
  }

  if (!config.expectedAudience) {
    throw new Error('JWT_AUDIENCE is required');
  }

  if (!config.expectedIssuer) {
    throw new Error('JWT_ISSUER is required');
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new AuthenticationError(401, 'Missing authorization header');
      }

      const tokenMatch = authHeader.match(/^Bearer\s+(\S+)$/);
      if (!tokenMatch) {
        throw new AuthenticationError(401, 'Invalid authorization header format');
      }

      const token = tokenMatch[1];

      const decoded = jwt.verify(token, config.publicKey, {
        algorithms: config.allowedAlgorithms as jwt.Algorithm[],
        audience: config.expectedAudience,
        issuer: config.expectedIssuer,
        maxAge: `${config.maxTokenAge}s`,
      }) as JWTPayload;

      (req as any).user = {
        id: decoded.sub,
        audience: decoded.aud,
        issuer: decoded.iss,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000),
      };

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token expired' });
        return;
      }

      res.status(500).json({ error: 'Authentication failed' });
    }
  };
}

export function generateTestToken(
  userId: string,
  privateKey: string,
  config: Partial<AuthConfig> = {}
): string {
  const finalConfig = { ...defaultConfig, ...config };

  const payload: JWTPayload = {
    sub: userId,
    aud: finalConfig.expectedAudience,
    iss: final