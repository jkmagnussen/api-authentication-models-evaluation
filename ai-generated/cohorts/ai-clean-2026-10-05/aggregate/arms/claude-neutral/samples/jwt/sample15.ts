```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '1h';

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const generateToken = (userId: string, email: string): string => {
  const payload: JwtPayload = {
    userId,
    email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = decoded;
  next();
};

export const refreshTokenMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as JwtPayload;

    if (!decoded.userId || !decoded.email) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }

    const newToken = generateToken(decoded.userId, decoded.email);
    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ error: 'Failed to refresh token' });
  }
};

app.post('/auth/login', (req: Request, res: Response) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    res.status(400).json({ error: 'Missing userId or email' });
    return;
  }

  const token = generateToken(userId, email);
  res.json({ token });
});

app.post('/auth/refresh', refreshTokenMiddleware);

app.get('/protected', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    message: 'This is a protected route',
    user: req.user,
  });
});

app.get('/user-info', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({
    userId: req.user?.userId,
    email: req.user?.email,
    message: 'User information retrieved successfully',
  });
});

app.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

const PORT = process.env.PORT || 3