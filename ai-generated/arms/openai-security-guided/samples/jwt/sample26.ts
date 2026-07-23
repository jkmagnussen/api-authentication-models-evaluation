import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, VerifyOptions } from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE } = process.env;

if (!JWT_SECRET || !JWT_ISSUER || !JWT_AUDIENCE) {
  throw new Error('Missing JWT configuration in environment variables');
}

const jwtConfig: VerifyOptions = {
  algorithms: ['HS256'],
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE
};

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET as Secret, jwtConfig, (err, user: JwtPayload | undefined) => {
      if (err) {
        return res.status(403).send('Forbidden');
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).send('Unauthorized');
  }
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, JWT_SECRET as Secret, {
    expiresIn: '1h',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: 'HS256'
  });
};