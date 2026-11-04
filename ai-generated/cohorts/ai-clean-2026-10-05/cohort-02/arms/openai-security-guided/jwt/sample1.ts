import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'your-secure-secret';

export interface JwtPayload {
  userId: string;
  username: string;
}

export const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
      return;
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const createToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h', algorithm: 'HS256' });
};

export const validateTokenInput = (token: string): boolean => {
  if (typeof token !== 'string' || token.trim() === '') {
    return false;
  }
  return true;
};