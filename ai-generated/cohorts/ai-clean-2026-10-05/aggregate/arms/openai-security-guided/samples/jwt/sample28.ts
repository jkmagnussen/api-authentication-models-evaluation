import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';

const app = express();
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secure-default-secret';

interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

export const jwtAuthMiddleware = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

app.use(jwtAuthMiddleware);

app.get('/protected', (req: CustomRequest, res: Response) => {
  if (!req.user) {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json({ message: 'Protected content', user: req.user });
});

export default app;