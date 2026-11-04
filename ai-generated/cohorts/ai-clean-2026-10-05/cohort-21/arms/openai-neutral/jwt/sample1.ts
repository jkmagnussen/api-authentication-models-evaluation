import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

const app = express();
const JWT_SECRET: Secret = 'your_secret_key';

interface JwtPayload {
  userId: string;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user: JwtPayload | undefined) => {
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

app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Replace this with real user validation
  if (username === 'test' && password === 'test') {
    const userId = '12345';
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.sendStatus(401);
  }
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'This is a protected route', userId: req.user?.userId });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}