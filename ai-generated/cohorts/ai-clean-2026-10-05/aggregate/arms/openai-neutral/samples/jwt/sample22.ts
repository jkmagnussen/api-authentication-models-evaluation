import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const SECRET_KEY = 'your_secret_key';

interface JwtPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).send('Access token is missing');
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send('Invalid access token');
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

app.use(express.json());

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.send(`Hello ${req.user?.email}, you have access to this protected route.`);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});