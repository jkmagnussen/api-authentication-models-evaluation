import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secure-default-secret';

// Middleware to validate JWT token
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    if (!isValidUser(user)) {
      return res.status(403).json({ message: 'Invalid token data' });
    }

    req.user = user;
    next();
  });
}

// Function to validate user object extracted from JWT
function isValidUser(user: string | JwtPayload): user is JwtPayload {
  return typeof user === 'object' && 'username' in user && typeof user.username === 'string';
}

// Example route that requires authentication
export const router = express.Router();

router.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: `Hello, ${req.user.username}!` });
});