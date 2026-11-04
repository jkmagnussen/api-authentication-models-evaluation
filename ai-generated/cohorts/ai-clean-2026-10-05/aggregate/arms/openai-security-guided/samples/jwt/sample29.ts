import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secure-secret-key';

interface JwtPayload {
  userId: string;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      res.status(401).json({ message: 'Unauthorized: Invalid token' });
      return;
    }

    req.user = decoded as JwtPayload;
    next();
  });
};

// Sample Express app setup
const app = express();

app.use(authenticateJWT);

app.get('/protected', (req: Request, res: Response) => {
  res.json({ message: 'This is a protected route', userId: req.user?.userId });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});