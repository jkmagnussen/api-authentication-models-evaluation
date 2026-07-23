import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

const SECRET_KEY: Secret = 'your_secret_key_here';

export interface AuthRequest extends Request {
  user?: string | object;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Access token is invalid' });
    }

    req.user = decoded;
    next();
  });
};

export const generateToken = (userData: object): string => {
  return jwt.sign(userData, SECRET_KEY, { expiresIn: '1h' });
};