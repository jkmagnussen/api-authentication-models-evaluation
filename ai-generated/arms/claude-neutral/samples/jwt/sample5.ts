```typescript
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: TokenPayload;
    }
  }
}

export const generateAuthToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const validateJWTMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header missing' });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.authenticatedUser = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: 'Invalid token' });
    } else {
      res.status(500).json({ error: 'Token verification failed' });
    }
  }
};

export const requireRoleMiddleware =
  (allowedRoles: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authenticatedUser) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.authenticatedUser.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };

export const loginController = (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  // Mock validation - in production use bcrypt and database lookup
  if (password !== 'demo-password') {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const user: TokenPayload = {
    userId: 'user-123',
    email: email,
    role: 'user',
  };

  const token = generateAuthToken(user);
  res.json({ token, user });
};

export const protectedDataController = (req: Request, res: Response): void => {
  res.json({
    message: 'This is protected data',
    user: req.authenticatedUser,
  });
};

export const adminOnlyController = (req: Request, res: Response): void => {
  res.json({
    message: 'Admin-only resource accessed',
    user: req.authenticatedUser,
  });
};

app.post('/auth/login', loginController);
app.get('/api/protected', validateJWTMiddleware, protectedDataController);
app.get(
  '/api/admin',
  validateJWTMidd