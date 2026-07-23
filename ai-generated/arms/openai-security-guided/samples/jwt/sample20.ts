import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { JWT_SECRET, ISSUER, AUDIENCE } = process.env;

if (!JWT_SECRET || !ISSUER || !AUDIENCE) {
  throw new Error('Environment variables for JWT are not set.');
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE
  }, (err: VerifyErrors | null, decoded: object | undefined) => {
    if (err) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    req.user = decoded;
    next();
  });
};

export { authMiddleware };