import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const SECRET_KEY = process.env.JWT_SECRET_KEY as string;

if (!SECRET_KEY) {
  throw new Error('Secret key not defined in environment variables');
}

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.sendStatus(401);
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

const validateToken = (token: string): boolean => {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return false;
  }
  return true;
};

app.use((req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (!validateToken(token)) {
    return res.sendStatus(400);
  }

  next();
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

export { app, authenticateJWT };