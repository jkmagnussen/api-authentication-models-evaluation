```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
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
  expectedAudience: process.env.JWT_AUDIENCE || 'api.example.com',
  expectedIssuer: process.env.JWT_ISSUER || 'auth.example.com',
  allowedAlgorithms: ['RS256', 'RS384', 'RS512'],
  maxTokenAge: 3600,
};

export function createAuthMiddleware(config: Partial<AuthConfig> = {}) {
  const mergedConfig = { ...defaultConfig, ...config };

  if (!mergedConfig.publicKey) {
    throw new Error('JWT_PUBLIC_KEY environment variable is required');
  }

  return function verifyJWTToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || typeof authHeader !== 'string') {
        res.status(401).json({ error: 'Missing authorization header' });
        return;
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        res.status(401).json({ error: 'Invalid authorization header format' });
        return;
      }

      const token = parts[1];

      if (!token || typeof token !== 'string' || token.length === 0) {
        res.status(401).json({ error: 'Empty token' });
        return;
      }

      const decoded = jwt.verify(token, mergedConfig.publicKey, {
        algorithms: mergedConfig.allowedAlgorithms as jwt.Algorithm[],
        audience: mergedConfig.expectedAudience,
        issuer: mergedConfig.expectedIssuer,
        maxAge: `${mergedConfig.maxTokenAge}s`,
      }) as TokenPayload;

      if (!decoded.sub || typeof decoded.sub !== 'string') {
        res.status(401).json({ error: 'Invalid token subject' });
        return;
      }

      req.user = {
        id: decoded.sub,
        audience: decoded.aud,
        issuer: decoded.iss,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token has expired' });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      if (error instanceof jwt.NotBeforeError) {
        res.status(401).json({ error: 'Token not yet valid' });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function createTokenGenerator(config: Partial<AuthConfig> = {}) {
  const mergedConfig = { ...defaultConfig, ...config };

  const privateKey = process.env.JWT_PRIVATE_KEY;