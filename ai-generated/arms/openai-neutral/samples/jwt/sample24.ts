```typescript
import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

interface JWTConfig {
  secretKey: string;
  expectedIssuer: string;
  expectedAudience: string;
  allowedAlgorithms: string[];
  expirySeconds: number;
  clockTolerance: number;
}

interface AuthRequest extends Request {
  tokenPayload?: AuthPayload;
}

export const createSecureJWTMiddleware = (config: JWTConfig) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }

      const token = authHeader.slice(7);

      if (!token || token.length === 0) {
        return res.status(401).json({ error: 'Token is empty' });
      }

      const decoded = jwt.verify(token, config.secretKey, {
        algorithms: config.allowedAlgorithms as jwt.Algorithm[],
        issuer: config.expectedIssuer,
        audience: config.expectedAudience,
        clockTolerance: config.clockTolerance,
      }) as AuthPayload;

      if (!decoded.userId || !decoded.email) {
        return res.status(401).json({ error: 'Invalid token payload structure' });
      }

      req.tokenPayload = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token has expired' });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
};

export const issueAccessToken = (
  userId: string,
  email: string,
  secretKey: string,
  issuer: string,
  audience: string,
  expirySeconds: number
): string => {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + expirySeconds;

  return jwt.sign(
    {
      userId,
      email,
      iat: now,
      exp: expiry,
      iss: issuer,
      aud: audience,
    },
    secretKey,
    {
      algorithm: 'HS256',
      issuer,
      audience,
    }
  );
};

export const validateTokenExpiry = (token: string, secretKey: string): boolean => {
  try {
    jwt.verify(token, secretKey);
    return true;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return false;
    }
    return false;
  }
};

export const decodeTokenWithoutVerification = (token: string): AuthPayload | null => {
  try {
    const decoded = jwt.decode(token) as AuthPayload | null;
    return decoded;
  } catch {
    return null;
  }
};

export const extractUserIdFromRequest = (req: AuthRequest): string | null => {
  return req.tokenPayload?.userId || null;