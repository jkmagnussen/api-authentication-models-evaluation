import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'securesecretkey';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

app.use(express.json());

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'You have accessed a protected route!', user: req.user });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});