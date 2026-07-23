import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'yourSecretKey';

export const jwtAuthenticationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token missing or malformed' });
    return;
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Token verification failed' });
      return;
    }
    (req as any).user = decoded;
    next();
  });
};

export const createJwtToken = (payload: object): string => {
  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};

const app = express();

app.use(jwtAuthenticationMiddleware);

app.get('/secure', (req, res) => {
  res.json({ message: 'Secure data accessed', user: (req as any).user });
});

export default app;