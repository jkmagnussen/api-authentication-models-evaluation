import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      tokenData?: TokenPayload;
    }
  }
}

export const validateJwtToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Invalid authorization format' });
    return;
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET || 'default-secret-key';

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.tokenData = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token signature' });
    } else {
      res.status(401).json({ error: 'Token verification failed' });
    }
  }
};

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET || 'default-secret-key';
  const expiresIn = process.env.JWT_EXPIRY || '1h';

  return jwt.sign(payload, secret, { expiresIn });
};

export const authorizeByRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tokenData) {
      res.status(401).json({ error: 'No token data found' });
      return;
    }

    if (!allowedRoles.includes(req.tokenData.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const refreshTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.tokenData) {
    res.status(401).json({ error: 'No authentication data' });
    return;
  }

  const { userId, email, role } = req.tokenData;
  const newToken = generateAccessToken({ userId, email, role });

  res.setHeader('X-New-Token', newToken);
  next();
};

app.post('/authenticate', (req: Request, res: Response): void => {
  const token = generateAccessToken({
    userId: 'user-123',
    email: 'user@example.com',
    role: 'user',
  });

  res.json({ accessToken: token });
});

app.get('/protected', validateJwtToken, (req: Request, res: Response): void => {
  res.json({ message: 'Access granted', user: req.tokenData });
});

app.get(
  '/admin-only',
  validateJwtToken,
  authorizeByRole(['admin']),
  (req: Request,