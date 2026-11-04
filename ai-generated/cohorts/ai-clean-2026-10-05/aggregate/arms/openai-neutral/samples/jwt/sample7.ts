import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';

interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];
  const secretKey: Secret = process.env.JWT_SECRET || 'your-secret-key';

  if (!token) {
    return res.status(401).send('Access denied. No token provided.');
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).send('Invalid token.');
    }
    req.user = user;
    next();
  });
};

const app = express();

app.use(express.json());

app.get('/protected', authenticateJWT, (req: CustomRequest, res: Response) => {
  res.send('This is a protected route');
});

export const startServer = (port: number) => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};