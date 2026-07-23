import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors, JwtPayload } from 'jsonwebtoken';
import { promisify } from 'util';

const jwtVerifyAsync = promisify(jwt.verify);

const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
const validAudience = 'yourAudience';
const validIssuer = 'yourIssuer';
const tokenExpiry = '1h';
const algorithms = ['HS256'];

export const createAuthToken = (payload: object): string => {
  return jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    expiresIn: tokenExpiry,
    audience: validAudience,
    issuer: validIssuer
  });
};

export const jwtAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized access, token missing.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await jwtVerifyAsync(token, secretKey, {
      audience: validAudience,
      issuer: validIssuer,
      algorithms
    }) as JwtPayload;

    req.user = decoded;
    next();
  } catch (error) {
    const err = error as VerifyErrors;
    res.status(401).json({ error: `Unauthorized access, ${err.message}.` });
  }
};

export const configureAuthRoutes = (app: express.Application): void => {
  app.use('/secure', jwtAuthMiddleware, (req: Request, res: Response) => {
    res.status(200).json({ message: 'Access granted to secure route.' });
  });
};