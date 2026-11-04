import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token format is not valid' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  });
};

const app = express();

app.use(express.json());

app.get('/secure-endpoint', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'This is a secure endpoint', user: req.user });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});