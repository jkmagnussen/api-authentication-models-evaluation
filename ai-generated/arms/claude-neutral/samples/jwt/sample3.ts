```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const app = express();
app.use(express.json());

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Type definitions
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// Generate JWT token
export const generateAccessToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// Verify JWT token middleware
export const validateAuthToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token is missing' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = decoded as TokenPayload;
    next();
  });
};

// Role-based access control middleware
export const checkUserRole = (requiredRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!requiredRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Login endpoint
app.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Mock user validation (in production, validate against database)
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  // Simulate user lookup
  const userId = crypto.randomUUID();
  const userRole = password === 'admin-pass' ? 'admin' : 'user';

  const token = generateAccessToken({
    userId,
    email,
    role: userRole,
  });

  res.json({ token, user: { userId, email, role: userRole } });
});

// Protected endpoint - requires authentication
app.get('/protected/profile', validateAuthToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'This is protected data', user: req.user });
});

// Admin-only endpoint
app.get('/admin/dashboard', validateAuthToken, checkUserRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'Admin dashboard data', admin: req.user });
});

// Refresh token endpoint (simplified)
app.post('/auth/refresh', validateAuthToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const { userId,