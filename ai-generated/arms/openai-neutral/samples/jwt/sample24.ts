import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';

const secretKey = 'your-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    res.status(403).send('Access denied. No token provided.');
    return;
  }

  jwt.verify(token, secretKey, (err: VerifyErrors | null, user: JwtPayload | undefined) => {
    if (err) {
      res.status(403).send('Invalid token.');
    } else {
      req.user = user;
      next();
    }
  });
};