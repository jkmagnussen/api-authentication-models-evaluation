import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';

const secretKey: Secret = 'your_secret_key_here';

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header missing' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Token missing' });
    return;
  }

  try {
    const decodedToken = jwt.verify(token, secretKey) as JwtPayload;
    (req as any).userId = decodedToken.userId;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token is not valid' });
  }
}

const app = express();

app.use(jwtAuthMiddleware);

app.get('/protected', (req: Request, res: Response) => {
  res.send(`Hello, user with ID: ${(req as any).userId}`);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});