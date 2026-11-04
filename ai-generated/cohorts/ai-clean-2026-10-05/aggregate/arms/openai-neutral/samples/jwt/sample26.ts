import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'your_secret_key';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
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
};

export const generateToken = (user: object): string => {
  return jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
}; 

// Sample usage in an Express application
const app = express();

app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  // Simulate user authentication
  if (username === 'user' && password === 'password') {
    const user = { username };
    const accessToken = generateToken(user);
    res.json({ accessToken });
  } else {
    res.sendStatus(401);
  }
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.send('This is a protected route');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});