```typescript
import express, { Request, Response, NextFunction, Router } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: { id: string; email: string };
}

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRY = '24h';

export const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
};

export const extractBearerToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  return parts[1];
};

export const protectRoute = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  req.userId = payload.userId;
  req.user = { id: payload.userId, email: payload.email };
  next();
};

export const createSecureRouter = (): Router => {
  const router = express.Router();

  router.post('/register', (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    const token = generateAccessToken(userId, email);

    res.json({
      userId,
      email,
      token,
      expiresIn: TOKEN_EXPIRY,
    });
  });

  router.post('/login', (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    const token = generateAccessToken(userId, email);

    res.json({
      userId,
      email,
      token,
      expiresIn: TOKEN_EXPIRY,
    });
  });

  router.get('/profile', protectRoute, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      userId: req.userId,
      user: req.user,
      message: 'Protected route accessed successfully',
    });
  });

  router.post('/refresh', (req: Request, res