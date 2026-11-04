import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_secret_key_here';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
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

export const generateToken = (user: object): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
};

const app = express();
app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Replace with your user authentication logic
  if (username === 'user' && password === 'password') {
    const user = { username };
    const token = generateToken(user);
    res.json({ token });
  } else {
    res.sendStatus(401);
  }
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.send('Protected content');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});