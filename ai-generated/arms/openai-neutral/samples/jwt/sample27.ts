import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'your_secret_key';
const AUTH_HEADER = 'authorization';

export const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers[AUTH_HEADER]?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ message: 'Token is missing!' });
    return;
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      res.status(403).json({ message: 'Invalid token!' });
      return;
    }

    req.user = decoded;
    next();
  });
};