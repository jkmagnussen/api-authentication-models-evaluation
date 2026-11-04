import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const app = express();

// Secret key for JWT signing and verification
const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key';

// Middleware to validate JWT
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized: No authorization header');
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send('Forbidden: Invalid token');
    }

    req.user = user as JwtPayload;
    next();
  });
};

// Example route
app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.send('You have accessed a protected route!');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

export default app;