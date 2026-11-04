import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'your_secret_key';

export interface AuthenticatedRequest extends Request {
  user?: string | object;
}

export const jwtAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }

    req.user = decoded;
    next();
  });
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};

const app = express();

app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username } = req.body;
  const token = generateToken({ username });
  res.json({ token });
});

app.get('/protected', jwtAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});