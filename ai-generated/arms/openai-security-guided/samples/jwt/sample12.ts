import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

const secretProvider: GetVerificationKey = jwksRsa.expressJwtSecret({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: 'https://your-auth-domain/.well-known/jwks.json',
});

const jwtOptions = {
  audience: 'your-audience',
  issuer: 'https://your-auth-domain/',
  algorithms: ['RS256'],
};

export const jwtAuthMiddleware = expressjwt({
  secret: secretProvider,
  ...jwtOptions,
}).unless({ path: ['/public'] });

export const errorHandlingMiddleware = (
  err: VerifyErrors,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: 'Invalid token' });
  } else {
    next(err);
  }
};