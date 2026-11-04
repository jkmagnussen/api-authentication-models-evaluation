import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'your-secure-default-secret';

interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Access denied, token missing!' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token!' });
    }
    req.user = user;
    next();
  });
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' });
};

const app = express();
app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return res.status(400).json({ message: 'Invalid input!' });
  }

  // Replace this section with actual user authentication
  if (username === 'user' && password === 'pass') {
    const token = generateToken(username);
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials!' });
  }
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.status(200).json({ message: 'You have accessed a protected route!', user: (req as CustomRequest).user });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});