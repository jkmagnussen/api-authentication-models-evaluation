import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token is missing or invalid' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded: JwtPayload | undefined) => {
    if (err || !decoded) {
      return res.status(401).json({ message: 'Token is invalid or expired' });
    }
    
    req.user = decoded;
    next();
  });
};

const app = express();

app.use(authenticateJWT);

app.get('/protected', (req: Request, res: Response) => {
  res.json({ message: 'Secure data', user: req.user });
});

export default app;