import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'your_secret_key';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing or invalid' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    
    req.user = user;
    next();
  });
};

export const generateToken = (user: object): string => {
  return jwt.sign(user, secretKey, { expiresIn: '1h' });
};

const app = express();

app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (username && password) {
    const user = { username }; // In real application, validate user credentials

    const accessToken = generateToken(user);
    res.json({ accessToken });
  } else {
    res.status(400).json({ message: 'Username and password are required' });
  }
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

export default app;