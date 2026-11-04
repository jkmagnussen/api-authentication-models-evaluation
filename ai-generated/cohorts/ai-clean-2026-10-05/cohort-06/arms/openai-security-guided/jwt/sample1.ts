import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-default-secret';
const TOKEN_EXPIRATION = '1h';

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
};

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    req.user = user;
    next();
  });
};

const app = express();
app.use(express.json());

// Sample route that requires authentication
app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'This is a protected route', userId: req.user?.userId });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

export const validateToken = (token: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};