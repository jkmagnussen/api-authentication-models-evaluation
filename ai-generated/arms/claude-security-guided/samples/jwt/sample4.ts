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
  allowedAlgorithms: jwt.Algorithm[];
  maxTokenAge: number;
}

class JwtAuthenticator {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  private validateConfig(config: AuthConfig): void {
    if (!config.publicKey || config.publicKey.trim().length === 0) {
      throw new Error('Public key is required');
    }
    if (!config.expectedAudience || config.expectedAudience.trim().length === 0) {
      throw new Error('Expected audience must be specified');
    }
    if (!config.expectedIssuer || config.expectedIssuer.trim().length === 0) {
      throw new Error('Expected issuer must be specified');
    }
    if (!Array.isArray(config.allowedAlgorithms) || config.allowedAlgorithms.length === 0) {
      throw new Error('At least one allowed algorithm must be specified');
    }
    if (typeof config.maxTokenAge !== 'number' || config.maxTokenAge <= 0) {
      throw new Error('Max token age must be a positive number');
    }
  }

  authenticate(req: Request, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
      }

      const token = authHeader.slice(7);
      
      if (typeof token !== 'string' || token.length === 0) {
        res.status(401).json({ error: 'Invalid token format' });
        return;
      }

      const decoded = jwt.verify(token, this.config.publicKey, {
        algorithms: this.config.allowedAlgorithms,
        audience: this.config.expectedAudience,
        issuer: this.config.expectedIssuer,
        maxAge: `${this.config.maxTokenAge}s`,
      }) as TokenPayload;

      if (!decoded.sub || typeof decoded.sub !== 'string') {
        res.status(401).json({ error: 'Invalid token subject' });
        return;
      }

      (req as Request & { user?: TokenPayload }).user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token has expired' });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
      } else if (error instanceof jwt.NotBeforeError) {
        res.status(401).json({ error: 'Token not yet valid' });
      } else {
        res.status(401).json({ error: 'Authentication failed' });
      }
    }
  }

  bind(): (req: Request, res: Response, next: NextFunction) => void {
    return this.authenticate.bind(this);
  }
}

export function createJwtMiddleware(config: AuthConfig): (req: