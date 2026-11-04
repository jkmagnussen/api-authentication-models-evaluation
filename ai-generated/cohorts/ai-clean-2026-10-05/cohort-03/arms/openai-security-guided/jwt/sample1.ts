import express, { Request, Response, NextFunction } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'default_secret';

// Middleware to authenticate JWT tokens
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded: JwtPayload | undefined) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }

    // @ts-ignore
    req.user = decoded;
    next();
  });
};

// Sample route that requires authentication
app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'You have accessed a protected route!', user: req.user });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});