import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'your_secret_key';

export function generateToken(payload: object): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

const app = express();
app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Mock user authentication
  if (username === 'user' && password === 'password') {
    const token = generateToken({ username });
    res.json({ token });
  } else {
    res.sendStatus(401);
  }
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'You have accessed a protected route!', user: req.user });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});