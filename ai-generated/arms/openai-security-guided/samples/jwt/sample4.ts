import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret';
const JWT_ISSUER = process.env.JWT_ISSUER || 'issuer.example.com';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'audience.example.com';
const JWT_ALGORITHM: jwt.Algorithm = 'HS256';
const TOKEN_EXPIRATION: string = '1h';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }

  jwt.verify(token, JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  }, (err, decoded: JwtPayload | undefined) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalid' });
    }

    req.user = decoded;
    next();
  });
};

export const generateToken = (userId: string): string => {
  const payload = { sub: userId };
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: TOKEN_EXPIRATION,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  });
};

export const validateToken = (token: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    }, (err, decoded: JwtPayload | undefined) => {
      if (err) {
        return reject(new Error('Token validation failed'));
      }
      resolve(decoded as JwtPayload);
    });
  });
};