import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'yourSecretKey';

// Middleware for JWT authentication
export function verifyJwtToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header missing' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Token not provided' });
    return;
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      res.status(403).json({ message: 'Invalid or expired token' });
      return;
    }

    req.user = decoded;
    next();
  });
}

// Usage in an Express app
const app = express();

app.use('/protected-route', verifyJwtToken, (req: Request, res: Response) => {
  res.status(200).json({ message: 'Access granted', user: req.user });
});