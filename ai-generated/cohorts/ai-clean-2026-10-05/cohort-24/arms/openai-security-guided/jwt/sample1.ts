import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';

const app = express();

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secure-secret-key';

interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token is missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  });
};

app.use(authenticateJWT);

app.get('/secured-endpoint', (req: CustomRequest, res: Response) => {
  res.json({ message: 'This is a secured endpoint', user: req.user });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});