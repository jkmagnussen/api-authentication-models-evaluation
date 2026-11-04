import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'defaultsecretkey';

interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const jwtAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token not provided' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = decoded;
    next();
  });
};

const app = express();

app.use(express.json());

app.get('/secure', jwtAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ message: 'Access to secure resource granted', user: req.user });
});

export default app;