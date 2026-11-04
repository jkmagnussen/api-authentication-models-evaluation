import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';

const SECRET_KEY: Secret = process.env.JWT_SECRET || 'your-secure-secret';

interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    req.user = user;
    next();
  });
};

export const generateAccessToken = (username: string): string => {
  return jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
};

const app = express();

app.use(express.json());

app.get('/protected', authenticateJWT, (req: CustomRequest, res: Response) => {
  res.json({ message: `Hello, ${req.user?.username}` });
});

export default app;