```typescript
import { Request, Response, NextFunction } from 'express';
import jwt, { VerifyOptions, JsonWebTokenError } from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: jwt.JwtPayload;
}

interface JwtConfig {
  secret: string;
  audience: string;
  issuer: string;
  algorithms: jwt.Algorithm[];
  expirySeconds: number;
}

interface TokenPayload extends jwt.JwtPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
}

class JwtAuthenticationError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'JwtAuthenticationError';
  }
}

export function createTokenVerifier(config: JwtConfig) {
  // Validate configuration at creation time
  if (!config.secret || config.secret.length < 32) {
    throw new Error('Secret must be at least 32 characters');
  }
  if (!config.audience || !config.issuer) {
    throw new Error('Audience and issuer are required');
  }
  if (config.algorithms.length === 0) {
    throw new Error('At least one algorithm must be specified');
  }
  if (config.expirySeconds < 60) {
    throw new Error('Expiry must be at least 60 seconds');
  }

  const verifyOptions: VerifyOptions = {
    algorithms: config.algorithms,
    audience: config.audience,
    issuer: config.issuer,
  };

  return async (token: string): Promise<TokenPayload> => {
    try {
      const decoded = jwt.verify(token, config.secret, verifyOptions);

      if (typeof decoded === 'string') {
        throw new JwtAuthenticationError(
          'INVALID_TOKEN_FORMAT',
          'Token payload is not an object',
          401
        );
      }

      // Validate critical claims
      if (!decoded.sub) {
        throw new JwtAuthenticationError(
          'MISSING_SUBJECT',
          'Token missing subject claim',
          401
        );
      }

      if (!decoded.exp) {
        throw new JwtAuthenticationError(
          'MISSING_EXPIRY',
          'Token missing expiry claim',
          401
        );
      }

      const expiryTime = decoded.exp * 1000;
      if (Date.now() > expiryTime) {
        throw new JwtAuthenticationError(
          'TOKEN_EXPIRED',
          'Token has expired',
          401
        );
      }

      return decoded as TokenPayload;
    } catch (error) {
      if (error instanceof JwtAuthenticationError) {
        throw error;
      }

      if (error instanceof JsonWebTokenError) {
        const statusCode =
          error.name === 'TokenExpiredError' ? 401 : 403;
        throw new JwtAuthenticationError(
          error.name,
          error.message,
          statusCode
        );
      }

      throw new JwtAuthenticationError(
        'VERIFICATION_FAILED',
        'Token verification failed',
        401
      );
    }
  };
}

export function generateAuthMiddleware(config: JwtConfig) {
  const verifier = createTokenVerifier(config);

  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;