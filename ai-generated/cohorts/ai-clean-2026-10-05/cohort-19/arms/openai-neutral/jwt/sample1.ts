import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'your_secret_key';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(403).send('A token is required for authentication');
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(401).send('Invalid Token');
    }
    req.user = user;
    next();
  });
};

export const generateToken = (user: object): string => {
  return jwt.sign(user, secretKey, { expiresIn: '1h' });
};