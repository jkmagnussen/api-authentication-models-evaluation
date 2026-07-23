import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, VerifyErrors } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const jwtSecret: Secret = process.env.JWT_SECRET || 'your-secure-secret';
const jwtIssuer = 'your-issuer';
const jwtAudience = 'your-audience';
const jwtAlgorithms: jwt.Algorithm[] = ['HS256'];

const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, jwtSecret, { algorithms: jwtAlgorithms, issuer: jwtIssuer, audience: jwtAudience }, (err: VerifyErrors | null) => {
      if (err) {
        return res.status(403).send('Forbidden');
      }
      next();
    });
  } else {
    res.status(401).send('Unauthorized');
  }
};

export { authenticateJWT };