import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const secretKey = 'your_secret_key';

export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const jwtAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};

const app = express();

app.use('/protected-route', jwtAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'You have access to this protected route!', user: req.user });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});