import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const SECRET_KEY = 'your_secret_key';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing or invalid' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    req.user = user;
    next();
  });
};

// Example route to be protected
app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'Protected data', user: req.user });
});

export const generateToken = (user: object): string => {
  return jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
};

// Example route to generate token
app.post('/login', (req: Request, res: Response) => {
  const user = { id: 1, username: 'testuser' }; // Example user
  const token = generateToken(user);
  res.json({ token });
});

export default app;