```typescript
import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

interface TokenConfig {
  secret: string;
  allowedAudiences: string[];
  trustedIssuers: string[];
  requiredAlgorithm: string;
  maxExpirySeconds: number;
}

const defaultTokenConfig: TokenConfig = {
  secret: process.env.JWT_SECRET || '',
  allowedAudiences: (process.env.JWT_AUDIENCES || '').split(',').filter(Boolean),
  trustedIssuers: (process.env.JWT_ISSUERS || '').split(',').filter(Boolean),
  requiredAlgorithm: 'HS256',
  maxExpirySeconds: 3600,
};

interface AuthenticatedRequest extends Request {
  tokenPayload?: JWTPayload;
  userId?: string;
}

export function validateTokenConfig(config: TokenConfig): void {
  if (!config.secret || config.secret.length < 32) {
    throw new Error('JWT secret must be at least 32 characters');
  }
  if (config.allowedAudiences.length === 0) {
    throw new Error('At least one allowed audience must be configured');
  }
  if (config.trustedIssuers.length === 0) {
    throw new Error('At least one trusted issuer must be configured');
  }
  if (!['HS256', 'HS512', 'RS256'].includes(config.requiredAlgorithm)) {
    throw new Error('Algorithm must be HS256, HS512, or RS256');
  }
}

export function createAuthMiddleware(config: TokenConfig = defaultTokenConfig) {
  validateTokenConfig(config);

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, config.secret, {
        algorithms: [config.requiredAlgorithm] as jwt.VerifyOptions['algorithms'],
        audience: config.allowedAudiences,
        issuer: config.trustedIssuers,
      }) as JWTPayload;

      const now = Math.floor(Date.now() / 1000);
      const tokenAge = now - decoded.iat;

      if (tokenAge > config.maxExpirySeconds) {
        res.status(401).json({ error: 'Token has expired beyond maximum allowed age' });
        return;
      }

      if (!decoded.sub) {
        res.status(401).json({ error: 'Token missing subject claim' });
        return;
      }

      req.tokenPayload = decoded;
      req.userId = decoded.sub;
      next();
    } catch (error) {
      const errorMessage = error instanceof jwt.TokenExpiredError 
        ? 'Token has expired'
        : error instanceof jwt.JsonWebTokenError
        ? 'Invalid token signature'
        : 'Token validation failed';

      res.status(401).json({ error: errorMessage });
    }
  };
}

export function issueToken(
  userId: string,
  audience: string,
  issuer: string