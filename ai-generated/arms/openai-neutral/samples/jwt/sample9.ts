import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'your-secret-key';

export const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(401).send('Authorization header missing');
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).send('Token missing');
    return;
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      res.status(403).send('Invalid token');
      return;
    }

    req.user = { ...(decoded as object) };
    next();
  });
};