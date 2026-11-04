```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

// Login endpoint - generates JWT token
app.post('/login', (req: Request, res: Response): void => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    res.status(400).json({ error: 'userId and email are required' });
    return;
  }

  const token = generateToken({ userId, email });
  res.json({ token, expiresIn: '1h' });
});

// Protected endpoint - requires valid JWT
app.get('/protected', authenticateToken, (req: Request, res: Response): void => {
  res.json({
    message: 'This is a protected route',
    user: req.user,
  });
});

// Public endpoint for testing
app.get('/public', (req: Request, res: Response): void => {
  res.json({ message: 'This is a public route' });
});

// Refresh token endpoint
app.post('/refresh', (req: Request, res: Response): void => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  const newToken = generateToken(decoded);
  res.json({ token: newToken, expiresIn: '1h' });
});

// Logout endpoint (client-side should remove token)
app.post('/logout', authenticateToken, (req: Request, res: Response): void => {
  res.json({ message: 'Logged out successfully' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()