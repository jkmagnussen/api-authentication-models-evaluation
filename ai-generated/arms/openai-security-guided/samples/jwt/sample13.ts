import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const jwtAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access token is missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, {
    algorithms: ['HS256'],
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
    maxAge: '1h',
  }, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

// App setup
const app = express();
app.use(jwtAuthMiddleware);

app.get('/protected', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ message: 'Welcome to the protected route!', user: req.user });
});

export { app };