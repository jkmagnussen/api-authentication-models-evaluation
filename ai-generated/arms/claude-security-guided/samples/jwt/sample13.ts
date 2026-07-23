```typescript
import express from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
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
  allowedAlgorithms: jwt.Algorithm[];
  maxTokenAgeSeconds: number;
}

interface DecodeResult {
  success: boolean;
  payload?: JwtPayload;
  error?: string;
}

export const createTokenValidator = (config: AuthConfig) => {
  const validateTokenStructure = (token: string): boolean => {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    return true;
  };

  const decodeAndVerifyToken = (token: string): DecodeResult => {
    if (!validateTokenStructure(token)) {
      return { success: false, error: 'Invalid token format' };
    }

    try {
      const decoded = jwt.verify(token, config.publicKey, {
        algorithms: config.allowedAlgorithms,
        audience: config.expectedAudience,
        issuer: config.expectedIssuer,
      }) as JwtPayload;

      const currentTime = Math.floor(Date.now() / 1000);
      const tokenAge = currentTime - decoded.iat;

      if (tokenAge > config.maxTokenAgeSeconds) {
        return { success: false, error: 'Token exceeds maximum age' };
      }

      if (decoded.exp <= currentTime) {
        return { success: false, error: 'Token has expired' };
      }

      return { success: true, payload: decoded };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
      return { success: false, error: errorMessage };
    }
  };

  return { decodeAndVerifyToken, validateTokenStructure };
};

export const authorizationMiddleware = (config: AuthConfig) => {
  const validator = createTokenValidator(config);

  return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      res.status(401).json({ error: 'Missing authorization header' });
      return;
    }

    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!bearerMatch) {
      res.status(401).json({ error: 'Invalid authorization header format' });
      return;
    }

    const token = bearerMatch[1];
    const result = validator.decodeAndVerifyToken(token);

    if (!result.success) {
      res.status(403).json({ error: result.error });
      return;
    }

    (req as any).user = result.payload;
    next();
  };
};

export const generateTestToken = (
  payload: Partial<JwtPayload>,
  privateKey: string,
  algorithm: jwt.Algorithm = 'RS256',
  expiresInSeconds: number = 3600
): string => {
  const now = Math.floor(Date.now() / 1000);

  const tokenPayload: JwtPayload = {
    sub: payload.sub || 'test-user',
    aud: payload.aud || 'test-audience',
    iss: payload.iss || 'test-issuer',