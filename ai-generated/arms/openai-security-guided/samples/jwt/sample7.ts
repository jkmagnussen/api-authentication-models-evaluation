import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET_KEY || 'your-secure-secret';
const tokenIssuer = process.env.JWT_ISSUER || 'your-app';
const tokenAudience = process.env.JWT_AUDIENCE || 'your-app-users';
const jwtAlgorithms: jwt.Algorithm[] = ['HS256'];

export function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, secretKey, { algorithms: jwtAlgorithms, issuer: tokenIssuer, audience: tokenAudience }, (err: VerifyErrors | null, decoded: object | undefined) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  });
}

export default express()
  .use(jwtAuthMiddleware)
  .get('/protected', (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.status(200).json({ message: 'Welcome to the protected route!', user: req.user });
  });