import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'your_secret_key';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      (req as any).user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

export const generateToken = (user: object) => {
  return jwt.sign(user, secretKey, { expiresIn: '1h' });
};

// Usage example
const app = express();

app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  // mock user
  const user = { id: 1, username: 'test', email: 'test@example.com' };
  const token = generateToken(user);
  res.json({ token });
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'This is a protected route', user: (req as any).user });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});