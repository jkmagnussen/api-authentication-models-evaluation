import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Secret key for JWT signing
const jwtSecretKey = 'your-secure-key';

// Middleware function for token verification
export function verifyJwtToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, jwtSecretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token validation failed' });
    }
    req.user = decoded;
    next();
  });
}