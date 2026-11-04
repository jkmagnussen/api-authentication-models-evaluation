import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';

// Middleware to validate JWT
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).send('Authorization header missing');
    return;
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      res.status(403).send('Invalid token');
      return;
    }
    
    req.user = user;
    next();
  });
}

// Function to generate JWT
export function generateToken(user: object): string {
  return jwt.sign(user, secretKey, { expiresIn: '1h' });
}

app.use(express.json());

// Sample route
app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.send('This is a protected route');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;