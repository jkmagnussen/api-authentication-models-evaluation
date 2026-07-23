import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { JWT_SECRET_KEY, JWT_ISSUER, JWT_AUDIENCE } = process.env;

const allowedAlgorithms: jwt.Algorithm[] = ['HS256'];

if (!JWT_SECRET_KEY || !JWT_ISSUER || !JWT_AUDIENCE) {
  throw new Error('Environment variables for JWT are not properly set');
}

interface CustomJwtPayload extends JwtPayload {
  userId: string;
}

export const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized access' });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY, {
      algorithms: allowedAlgorithms,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }) as CustomJwtPayload;

    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    res.status(403).json({ error: 'Forbidden access' });
  }
};