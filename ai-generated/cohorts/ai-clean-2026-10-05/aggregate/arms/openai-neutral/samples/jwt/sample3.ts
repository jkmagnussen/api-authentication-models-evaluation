import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'your-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: string | object;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token is missing or invalid' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  });
};

export const generateToken = (user: object): string => {
  return jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
};

// Example usage in an Express application
const app = express();

app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Dummy user validation
  if (username === 'user' && password === 'password') {
    const user = { username };
    const token = generateToken(user);
    return res.json({ token });
  }
  res.status(401).json({ message: 'Username or password incorrect' });
});

app.get('/protected', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});