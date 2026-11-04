import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'your_secret_key';

export interface AuthenticatedRequest extends Request {
  user?: string | object;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
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

export function generateToken(user: object): string {
  return jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
}

const app = express();

app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Validate user credentials (this is a placeholder, implement actual logic)
  if (username && password) {
    const user = { username };
    const accessToken = generateToken(user);
    res.json({ accessToken });
  } else {
    res.sendStatus(400);
  }
});

app.get('/protected', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.send('This is a protected route');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});