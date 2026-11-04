import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'your_secret_key';

export interface JwtPayload {
  userId: string;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' });
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.sendStatus(403);
      }
      
      req.body.userId = (decoded as JwtPayload).userId;
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

  if (username === 'user' && password === 'password') {
    const userId = '12345';
    const token = generateToken(userId);
    res.json({ token });
  } else {
    res.sendStatus(401);
  }
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.send('This is a protected route');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});