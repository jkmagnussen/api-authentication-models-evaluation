import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'your-secure-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const jwtAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = jwt.verify(token, SECRET_KEY);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Failed to authenticate token' });
  }
};

export const issueToken = (payload: string | object, expiresIn: string | number = '1h'): string => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
};

// Example usage in an Express application
const app = express();

app.use(jwtAuthMiddleware);

app.get('/protected', (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    res.json({ message: 'Access granted', user: req.user });
  } else {
    res.status(401).json({ message: 'Access denied' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});