```typescript
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyOptions, Secret } from 'jsonwebtoken';

interface AuthenticationConfig {
  readonly secretKey: string;
  readonly allowedAudience: string[];
  readonly allowedIssuers: string[];
  readonly acceptedAlgorithms: jwt.Algorithm[];
  readonly maxTokenAge: string;
}

interface VerifiedTokenPayload extends JwtPayload {
  aud?: string | string[];
  iss?: string;
}

interface AuthenticatedRequest extends Request {
  tokenPayload?: VerifiedTokenPayload;
  userId?: string;
}

const createSecureValidator = (config: AuthenticationConfig) => {
  const validateTokenStructure = (token: string): boolean => {
    const parts = token.split('.');
    return parts.length === 3;
  };

  const validateAudienceClaim = (payload: VerifiedTokenPayload): boolean => {
    if (!payload.aud) {
      return false;
    }
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    return audiences.some(aud => config.allowedAudience.includes(aud as string));
  };

  const validateIssuerClaim = (payload: VerifiedTokenPayload): boolean => {
    if (!payload.iss) {
      return false;
    }
    return config.allowedIssuers.includes(payload.iss);
  };

  const validateAlgorithm = (header: jwt.JwtHeader): boolean => {
    return header.alg ? config.acceptedAlgorithms.includes(header.alg) : false;
  };

  return {
    validateTokenStructure,
    validateAudienceClaim,
    validateIssuerClaim,
    validateAlgorithm,
  };
};

export const buildAuthenticationMiddleware = (config: AuthenticationConfig) => {
  const validator = createSecureValidator(config);

  const verificationOptions: VerifyOptions = {
    algorithms: config.acceptedAlgorithms,
    audience: config.allowedAudience,
    issuer: config.allowedIssuers,
    maxAge: config.maxTokenAge,
  };

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Missing authorization header' });
      return;
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      res.status(401).json({ error: 'Invalid authorization scheme' });
      return;
    }

    if (!validator.validateTokenStructure(token)) {
      res.status(401).json({ error: 'Malformed token' });
      return;
    }

    try {
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || !decoded.header) {
        res.status(401).json({ error: 'Invalid token format' });
        return;
      }

      if (!validator.validateAlgorithm(decoded.header)) {
        res.status(401).json({ error: 'Unsupported algorithm' });
        return;
      }

      const payload = jwt.verify(token, config.secretKey, verificationOptions) as VerifiedTokenPayload;

      if (!validator.validateAudienceClaim(payload)) {
        res.status(403).json({ error: 'Invalid audience claim