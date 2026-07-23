```typescript
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

interface TokenPayload {
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
  maxAgeSecs: number;
  allowedAlgorithms: jwt.Algorithm[];
}

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function buildAuthGuard(config: AuthConfig) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Missing authorization header' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      res.status(401).json({ error: 'Invalid authorization header format' });
      return;
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, config.publicKey, {
        algorithms: config.allowedAlgorithms,
        audience: config.expectedAudience,
        issuer: config.expectedIssuer,
        maxAge: `${config.maxAgeSecs}s`,
      }) as TokenPayload;

      // Additional validation for expiry
      const nowSecs = Math.floor(Date.now() / 1000);
      if (decoded.exp <= nowSecs) {
        res.status(401).json({ error: 'Token has expired' });
        return;
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
      } else if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token expired' });
      } else {
        res.status(401).json({ error: 'Authentication failed' });
      }
    }
  };
}

export function signToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  privateKey: string,
  expiresInSecs: number,
  algorithm: jwt.Algorithm = 'RS256'
): string {
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSecs,
  };

  return jwt.sign(tokenPayload, privateKey, {
    algorithm,
    expiresIn: expiresInSecs,
  });
}

export function validateTokenStructure(token: string): { valid: boolean; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token structure' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Token validation failed' };
  }
}

export function createAuthConfig(
  publicKeyPem: string,
  audience: string,
  issuer: string,
  maxAgeSeconds: number = 3600,
  algorithms: jwt.Algorithm[] = ['RS256', 'RS512']
): AuthConfig {
  if (!public