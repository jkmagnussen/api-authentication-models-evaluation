import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, VerifyErrors } from 'jsonwebtoken';
import { expressjwt as jwtMiddleware } from 'express-jwt';

const jwtSecret: Secret = process.env.JWT_SECRET || 'defaultsecret';
const jwtIssuer = process.env.JWT_ISSUER || 'defaultIssuer';
const jwtAudience = process.env.JWT_AUDIENCE || 'defaultAudience';
const jwtAlgorithms: jwt.Algorithm[] = ['HS256'];

const authenticateJWT = jwtMiddleware({
  secret: jwtSecret,
  algorithms: jwtAlgorithms,
  audience: jwtAudience,
  issuer: jwtIssuer,
  getToken: (req: Request) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    }
    return null;
  },
  requestProperty: 'auth',
});

function errorHandler(err: VerifyErrors, req: Request, res: Response, next: NextFunction) {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).send({ error: 'Invalid token' });
  }
  next(err);
}

export { authenticateJWT, errorHandler };