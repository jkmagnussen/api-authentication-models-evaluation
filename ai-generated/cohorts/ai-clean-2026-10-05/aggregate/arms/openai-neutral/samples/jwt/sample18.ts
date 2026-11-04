import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const jwtSecret = 'your_secret_key';

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: '1h' });
};

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Sample usage in an Express application
const app = express();

app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Validate user credentials (this is a mock example)
  if (username === 'test' && password === 'password') {
    const token = generateToken('userId-123');
    res.json({ token });
  } else {
    res.status(401).send('Username or password incorrect');
  }
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.send('This is a protected route');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});