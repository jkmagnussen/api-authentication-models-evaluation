import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'your-secure-secret';
const jwtIssuer = 'your-app-name';
const jwtAudience = 'your-app-users';
const jwtAlgorithms: jwt.Algorithm[] = ['HS256'];

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).send('Authorization header missing');
    return;
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, jwtSecret, { issuer: jwtIssuer, audience: jwtAudience, algorithms: jwtAlgorithms }, (err, decoded) => {
    if (err) {
      res.status(403).send('Invalid or expired token');
      return;
    }
    req.user = decoded;
    next();
  });
};

export const generateJWT = (userId: string): string => {
  const payload = { sub: userId };
  const options: jwt.SignOptions = { expiresIn: '1h', issuer: jwtIssuer, audience: jwtAudience, algorithm: 'HS256' };
  return jwt.sign(payload, jwtSecret, options);
};