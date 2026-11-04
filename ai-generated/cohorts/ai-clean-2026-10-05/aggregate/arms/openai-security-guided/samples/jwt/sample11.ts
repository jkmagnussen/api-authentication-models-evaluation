import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'your-secure-secret';

interface DecodedToken {
  userId: string;
  iat: number;
  exp: number;
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded: DecodedToken) => {
    if (err) {
      return res.status(403).json({ message: 'Token validation failed' });
    }

    req.user = { userId: decoded.userId };
    next();
  });
}

app.use(authenticateJWT);

app.get('/protected', (req: Request, res: Response) => {
  res.status(200).json({ message: 'This is a protected route', userId: req.user?.userId });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;