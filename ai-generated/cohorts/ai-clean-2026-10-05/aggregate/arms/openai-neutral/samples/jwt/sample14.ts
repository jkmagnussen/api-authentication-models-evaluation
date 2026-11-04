import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user as JwtPayload;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

export function generateToken(userId: string): string {
  const payload: JwtPayload = { userId };
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '1h' });
}

const app = express();
app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === 'test' && password === 'password') {
    const userId = '12345';
    const token = generateToken(userId);
    res.json({ token });
  } else {
    res.sendStatus(401);
  }
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'You are authorized', userId: req.user?.userId });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});