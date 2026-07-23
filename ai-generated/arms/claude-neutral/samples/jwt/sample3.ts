import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: { userId: string; email: string };
    }
  }
}

export const validateBearerToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    req.authenticatedUser = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, jwtSecret, { expiresIn: '1h' });
};

export const decodeTokenPayload = (token: string): { userId: string; email: string } | null => {
  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
};

export const setupAuthRoutes = (app: express.Application): void => {
  app.post('/auth/login', (req: Request, res: Response) => {
    const userId = 'user123';
    const email = 'user@example.com';
    const token = generateAccessToken(userId, email);
    res.json({ token, userId, email });
  });

  app.get('/auth/profile', validateBearerToken, (req: Request, res: Response) => {
    res.json({ user: req.authenticatedUser });
  });

  app.post('/auth/verify', (req: Request, res: Response) => {
    const { token } = req.body;
    const payload = decodeTokenPayload(token);
    if (payload) {
      res.json({ valid: true, payload });
    } else {
      res.status(401).json({ valid: false, error: 'Invalid token' });
    }
  });
};

const app = express();
app.use(express.json());

setupAuthRoutes(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;