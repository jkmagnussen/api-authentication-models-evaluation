```typescript
import { Request, Response, NextFunction } from 'express';
import jwt, { VerifyOptions, JwtPayload } from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

interface JWTConfig {
  secret: string;
  issuer: string;
  audience: string;
  algorithms: string[];
  maxAge: number;
}

interface TokenPayload extends JwtPayload {
  sub: string;
  aud?: string | string[];
  iss?: string;
}

const DEFAULT_CONFIG: JWTConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  issuer: process.env.JWT_ISSUER || 'auth-service',
  audience: process.env.JWT_AUDIENCE || 'api-service',
  algorithms: ['HS256'],
  maxAge: 3600,
};

export function createJWTVerifier(config: Partial<JWTConfig> = {}) {
  const finalConfig: JWTConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.secret || finalConfig.secret === 'your-secret-key') {
    throw new Error('JWT_SECRET must be configured');
  }

  if (!finalConfig.issuer || !finalConfig.audience) {
    throw new Error('JWT issuer and audience must be configured');
  }

  if (!finalConfig.algorithms || finalConfig.algorithms.length === 0) {
    throw new Error('At least one algorithm must be specified');
  }

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = extractTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN',
      });
    }

    const verifyOptions: VerifyOptions = {
      algorithms: finalConfig.algorithms as jwt.Algorithm[],
      issuer: finalConfig.issuer,
      audience: finalConfig.audience,
      maxAge: `${finalConfig.maxAge}s`,
    };

    jwt.verify(token, finalConfig.secret, verifyOptions, (err, decoded) => {
      if (err) {
        const statusCode = err.name === 'TokenExpiredError' ? 401 : 403;
        const errorCode =
          err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';

        return res.status(statusCode).json({
          error: err.message,
          code: errorCode,
        });
      }

      if (!decoded || typeof decoded === 'string') {
        return res.status(403).json({
          error: 'Invalid token payload',
          code: 'INVALID_PAYLOAD',
        });
      }

      if (!decoded.sub) {
        return res.status(403).json({
          error: 'Token missing subject claim',
          code: 'MISSING_SUBJECT',
        });
      }

      req.user = decoded as TokenPayload;
      next();
    });
  };
}

export function createJWTIssuer(config: Partial<JWTConfig> = {}) {
  const finalConfig: JWTConfig = { ...DEFAULT_CONFIG, ...config };

  if (!finalConfig.secret || finalConfig.secret === 'your-secret-key') {
    throw new Error('JWT_SECRET must be configured');
  }

  return (payload: Partial<TokenPayload>) => {
    if (!payload.sub) {
      throw new Error('Token subject (sub) is required');
    }