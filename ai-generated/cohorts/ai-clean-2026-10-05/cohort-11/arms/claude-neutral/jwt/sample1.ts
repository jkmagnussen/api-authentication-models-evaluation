```typescript
import Anthropic from '@anthropic-ai/sdk';
import express, { Request, Response, NextFunction } from 'express';

const client = new Anthropic();

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const generateJWT = (payload: { userId: string; email: string }): string => {
  // Simple base64 encoding for demonstration
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + 3600, // 1 hour expiration
  };
  const payload64 = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

  // Create signature (simplified - in production use proper HMAC)
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const signature = Buffer.from(`${header}.${payload64}${secret}`).toString('base64url').slice(0, 43);

  return `${header}.${payload64}.${signature}`;
};

export const verifyJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyJWT(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
};

export const createApp = () => {
  const app = express();
  app.use(express.json());

  app.post('/login', (req: Request, res: Response) => {
    const { email, userId } = req.body;
    if (!email || !userId) {
      res.status(400).json({ error: 'Email and userId are required' });
      return;
    }

    const token = generateJWT({ email, userId });
    res.json({ token });
  });

  app.get('/protected', authMiddleware, (req: Request, res: Response) => {
    res.json({ message: 'Access granted', user: req.user });
  });

  app.post('/validate-token', (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const payload = verifyJWT(token);
    if (payload) {
      res.json({ valid: true, payload });
    }