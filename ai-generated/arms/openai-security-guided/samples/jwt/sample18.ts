import { Request, Response, NextFunction } from 'express';
import jwt, { Algorithm } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key';
const JWT_ISSUER = process.env.JWT_ISSUER || 'your-issuer';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'your-audience';
const JWT_ALGORITHM: Algorithm = 'HS256';
const JWT_EXPIRATION = '1h';

export const createToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRATION,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  jwt.verify(token, JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalid or expired' });
    }
    req.user = decoded;
    next();
  });
};