import { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors, JwtPayload, Algorithm } from 'jsonwebtoken';
import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwks from 'jwks-rsa';

const jwtAudience = process.env.JWT_AUDIENCE || 'your-audience';
const jwtIssuer = process.env.JWT_ISSUER || 'https://your-issuer.com/';
const jwtAlgorithms: Algorithm[] = ['RS256'];
const jwtExpiry = '1h';

const jwksClient = jwks.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `${jwtIssuer}.well-known/jwks.json`
}) as GetVerificationKey;

const handleJwtError = (err: VerifyErrors | null, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    return res.status(401).json({
      error: err.name,
      message: err.message
    });
  }
  next();
};

export const authenticateJwt = expressjwt({
  secret: jwksClient,
  audience: jwtAudience,
  issuer: jwtIssuer,
  algorithms: jwtAlgorithms,
  credentialsRequired: true
}).unless({
  path: ['/public']
});

export const jwtErrorHandler = handleJwtError;