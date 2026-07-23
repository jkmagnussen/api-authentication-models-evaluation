import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';

export interface UserPayload {
  id: string;
  email: string;
}

const jwtSecret = process.env.JWT_SECRET || 'default_secret';
const tokenIssuer = 'your-app';
const tokenAudience = 'your-app-users';
const tokenAlgorithms: jwt.Algorithm[] = ['RS256'];

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, jwtSecret, {
    issuer: tokenIssuer,
    audience: tokenAudience,
    algorithms: tokenAlgorithms,
  }, (err: VerifyErrors | null, decoded: object | undefined) => {
    if (err) {
      return res.status(401).json({ message: 'Token verification failed', error: err.message });
    }

    req.user = decoded as UserPayload;
    next();
  });
}

export function generateToken(user: UserPayload): string {
  const token = jwt.sign({
    id: user.id,
    email: user.email,
  }, jwtSecret, {
    issuer: tokenIssuer,
    audience: tokenAudience,
    algorithm: tokenAlgorithms[0],
    expiresIn: '1h',
  });

  return token;
}