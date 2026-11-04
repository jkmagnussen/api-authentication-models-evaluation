import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

const app = express();
const SECRET_KEY: Secret = 'your_secret_key';

interface JwtPayload {
  userId: string;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.sendStatus(403);
      }
      
      req.user = decoded as JwtPayload;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.use(authenticateJWT);

app.get('/protected', (req: Request, res: Response) => {
  res.send('This is a protected route');
});

export default app;