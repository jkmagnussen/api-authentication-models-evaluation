import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'your_secret_key';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
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

export const generateToken = (user: object): string => {
  return jwt.sign(user, SECRET_KEY, { expiresIn: '1h' });
};

// Usage example (could be in a separate file)
const app = express();

app.post('/login', (req: Request, res: Response) => {
  // Assume user is authenticated
  const user = { username: req.body.username };
  const token = generateToken(user);
  res.json({ token });
});

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.send('This is a protected route');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});