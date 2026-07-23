import jwt, { Secret, VerifyErrors } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SECRET_KEY: Secret = process.env.JWT_SECRET || 'your-secure-secret';
const TOKEN_ISSUER = 'your-issuer';
const TOKEN_AUDIENCE = 'your-audience';
const ALLOWED_ALGORITHMS: jwt.Algorithm[] = ['HS256'];
const TOKEN_EXPIRATION = '1h'; // 1 hour

export function validateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  const verifyOptions: jwt.VerifyOptions = {
    algorithms: ALLOWED_ALGORITHMS,
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    maxAge: TOKEN_EXPIRATION,
  };

  jwt.verify(token, SECRET_KEY, verifyOptions, (err: VerifyErrors | null) => {
    if (err) {
      return res.status(403).json({ message: 'Token verification failed' });
    }
    next();
  });
}