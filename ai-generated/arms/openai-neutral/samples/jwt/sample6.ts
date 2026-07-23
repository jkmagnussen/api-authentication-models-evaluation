```typescript
import { Router, Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface TokenPayload extends JwtPayload {
  sub: string;
  aud: string;
  iss: string;
}

interface AuthConfig {
  publicKey: string;
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: string[];
  maxTokenAge: string;
}

const createAuthenticationGuard = (config: AuthConfig) => {
  const validateTokenStructure = (token: string): boolean => {
    const parts = token.split('.');
    return parts.length === 3;
  };

  const extractBearerToken = (authHeader: string | undefined): string | null => {
    if (!authHeader) return null;
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer') return null;
    return token || null;
  };

  const verifyTokenClaims = (payload: TokenPayload): { valid: boolean; error?: string } => {
    if (!payload.aud || payload.aud !== config.expectedAudience) {
      return { valid: false, error: 'Invalid audience claim' };
    }

    if (!payload.iss || payload.iss !== config.expectedIssuer) {
      return { valid: false, error: 'Invalid issuer claim' };
    }

    if (!payload.sub) {
      return { valid: false, error: 'Missing subject claim' };
    }

    return { valid: true };
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authorizationHeader = req.headers.authorization;
      const token = extractBearerToken(authorizationHeader);

      if (!token) {
        res.status(401).json({ error: 'Missing or malformed authorization header' });
        return;
      }

      if (!validateTokenStructure(token)) {
        res.status(401).json({ error: 'Invalid token format' });
        return;
      }

      const decoded = jwt.verify(token, config.publicKey, {
        algorithms: config.allowedAlgorithms as jwt.Algorithm[],
        audience: config.expectedAudience,
        issuer: config.expectedIssuer,
        maxAge: config.maxTokenAge,
      }) as TokenPayload;

      const claimsValidation = verifyTokenClaims(decoded);
      if (!claimsValidation.valid) {
        res.status(401).json({ error: claimsValidation.error });
        return;
      }

      (req as Request & { user: TokenPayload }).user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token has expired' });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
      } else {
        res.status(500).json({ error: 'Authentication failed' });
      }
    }
  };
};

const generateAccessToken = (
  payload: { sub: string; aud: string; iss: string },
  privateKey: string,
  expiresIn: string = '1h'
): string => {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn,
    issuer: payload.iss,
    audience: payload.aud,
  });
};

const