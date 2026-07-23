import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const secretKey: string = 'your-secret-key';

export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const jwtAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authorization header missing or malformed' });
    return;
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      res.status(403).json({ message: 'Invalid or expired token' });
      return;
    }
    req.user = decoded;
    next();
  });
};

// Sample usage in an Express application
const app = express();

app.use(jwtAuthMiddleware);

app.get('/secured-endpoint', (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'Secure content accessed', user: req.user });
});

export default app;