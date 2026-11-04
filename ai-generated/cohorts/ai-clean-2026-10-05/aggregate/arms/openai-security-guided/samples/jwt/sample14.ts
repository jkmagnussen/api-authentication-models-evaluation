import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'defaultSecretKey';

interface CustomRequest extends Request {
  user?: JwtPayload;
}

export function jwtAuthMiddleware(req: CustomRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token not found' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded as JwtPayload;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token verification failed' });
  }
}

// Example route using the middleware
const app = express();
app.use('/secure-route', jwtAuthMiddleware, (req: CustomRequest, res: Response) => {
  res.send(`Hello, ${req.user?.username}`);
});

export default app;