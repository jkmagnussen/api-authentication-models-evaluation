```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface AuthPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const generateAccessToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    SECRET_KEY,
    { expiresIn: '1h' }
  );
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
};

export const validateToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, SECRET_KEY) as AuthPayload;
  } catch {
    return null;
  }
};

export const authenticateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const authorizationHeader = req.headers.authorization;
  
  if (!authorizationHeader) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Invalid authorization format' });
    return;
  }

  const token = parts[1];
  const payload = validateToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
};

export const checkAdminRole = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

export const checkUserRole = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || (req.user.role !== 'user' && req.user.role !== 'admin')) {
    res.status(403).json({ error: 'User access required' });
    return;
  }
  next();
};

app.post('/auth/login', (req: Request, res: Response): void => {
  const { userId, email, role } = req.body;

  if (!userId || !email || !role) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const accessToken = generateAccessToken(userId, email, role);
  const refreshToken = generateRefreshToken(userId);

  res.json({
    accessToken,
    refreshToken,
    expiresIn: 3600
  });
});

app.post('/auth/refresh', (req: Request, res: Response): void => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  const payload = validateToken(refreshToken);
  if (!payload) {