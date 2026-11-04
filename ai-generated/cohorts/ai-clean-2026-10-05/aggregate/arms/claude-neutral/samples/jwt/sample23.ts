```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = 'your-secret-key-change-in-production';
const JWT_EXPIRATION = '1h';

interface TokenPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'No authorization header' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Invalid authorization header format' });
    return;
  }

  const token = parts[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
}

app.post('/login', (req: Request, res: Response): void => {
  const user: TokenPayload = {
    userId: '123',
    email: 'user@example.com',
  };

  const token = generateToken(user);
  res.json({ token });
});

app.get('/protected', authMiddleware, (req: Request, res: Response): void => {
  res.json({
    message: 'This is a protected route',
    user: req.user,
  });
});

app.post('/refresh', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  const newToken = generateToken(req.user);
  res.json({ token: newToken });
});

app.get('/profile', authMiddleware, (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  res.json({
    profile: {
      userId: req.user.userId,
      email: req.user.email,
      lastAccessed: new Date().toISOString(),
    },
  });
});

app.post('/logout', (req: Request, res: Response): void => {
  res.json({ message: 'Logout successful' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /login - Get JWT token');
  console.log('  GET /protected - Protected route');
  console.log('  POST /refresh - Refresh token');
  console.log('  GET /profile - Get user profile');
  console.log('  POST /logout