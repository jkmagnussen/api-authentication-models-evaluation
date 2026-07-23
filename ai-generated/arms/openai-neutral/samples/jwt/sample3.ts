import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';

const SECRET_KEY: Secret = 'your_secret_key';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).send('Access Denied: No Token Provided');
    return;
  }

  jwt.verify(token, SECRET_KEY, (err, decoded: JwtPayload | undefined) => {
    if (err) {
      res.status(403).send('Invalid Token');
      return;
    }

    req.user = decoded;
    next();
  });
};

export const authenticate = (req: Request, res: Response): void => {
  const { username, password } = req.body;
  
  // Sample validation; replace with real user authentication
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ username: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(403).send('Invalid Credentials');
  }
};

export const app = express();
app.use(express.json());
app.post('/login', authenticate);
app.get('/protected', verifyToken, (req, res) => {
  res.send('This is a protected route');
});