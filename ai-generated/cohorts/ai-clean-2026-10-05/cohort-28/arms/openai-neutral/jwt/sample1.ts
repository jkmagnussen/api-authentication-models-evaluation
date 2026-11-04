import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const app = express();
const secretKey = 'your_secret_key';

interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, secretKey, { expiresIn: '1h' });
};

export const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, secretKey, (err, user) => {
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

  // Dummy user validation
  if (username === 'user' && password === 'password') {
    const userId = '123'; // Example user ID
    const token = generateToken(userId);
    res.json({ token });
  } else {
    res.sendStatus(401);
  }
});

app.get('/protected', authenticateJWT, (req: CustomRequest, res: Response) => {
  res.send('You are authenticated');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});