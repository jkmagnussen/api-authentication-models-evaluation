import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const jwtAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized access, token missing!' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token is not valid or has expired!' });
    }

    req.user = decoded;
    next();
  });
};

app.use(jwtAuthMiddleware);

app.get('/protected', (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'This is a protected route!', user: req.user });
});

export default app;