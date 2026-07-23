import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'your_secret_key';

export const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or malformed' });
    return;
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Token is not valid' });
      return;
    }

    req.user = user;
    next();
  });
};

export const generateToken = (userData: object): string => {
  return jwt.sign(userData, secretKey, { expiresIn: '1h' });
};