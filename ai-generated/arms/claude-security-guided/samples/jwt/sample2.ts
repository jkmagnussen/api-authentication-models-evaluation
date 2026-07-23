```typescript
import { Router, Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyOptions } from 'jsonwebtoken';

interface TokenPayload extends JwtPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

interface JwtConfig {
  publicKey: string;
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: string[];
  maxExpirySeconds: number;
}

interface AuthRequest extends Request {
  tokenPayload?: TokenPayload;
}

const defaultConfig: JwtConfig = {
  publicKey: process.env.JWT_PUBLIC_KEY || '',
  expectedAudience: process.env.JWT_AUDIENCE || 'default-app',
  expectedIssuer: process.env.JWT_ISSUER || 'default-issuer',
  allowedAlgorithms: ['RS256'],
  maxExpirySeconds: 3600,
};

export function createTokenValidator(config: Partial<JwtConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.publicKey) {
    throw new Error('JWT_PUBLIC_KEY is required for token validation');
  }

  return (token: string): TokenPayload => {
    const verifyOptions: VerifyOptions = {
      algorithms: finalConfig.allowedAlgorithms as jwt.Algorithm[],
      audience: finalConfig.expectedAudience,
      issuer: finalConfig.expectedIssuer,
    };

    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(token, finalConfig.publicKey, verifyOptions) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Token verification failed: ${error.message}`);
      }
      throw error;
    }

    if (!decoded.sub) {
      throw new Error('Token missing required subject claim');
    }

    const issuedAt = decoded.iat || 0;
    const expiresAt = decoded.exp || 0;
    const tokenLifetime = expiresAt - issuedAt;

    if (tokenLifetime > finalConfig.maxExpirySeconds) {
      throw new Error(
        `Token lifetime ${tokenLifetime}s exceeds maximum ${finalConfig.maxExpirySeconds}s`,
      );
    }

    return decoded;
  };
}

export function buildAuthMiddleware(config: Partial<JwtConfig> = {}) {
  const validator = createTokenValidator(config);

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.get('Authorization');

      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return res.status(401).json({ error: 'Invalid Authorization header format' });
      }

      const token = parts[1];

      if (!token || token.trim() === '') {
        return res.status(401).json({ error: 'Empty token' });
      }

      const payload = validator(token);
      req.tokenPayload = payload;

      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      res.status(403).json({ error: message });
    }
  };
}

export function