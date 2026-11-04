import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret';

// Middleware to validate JWT
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: JwtPayload | undefined) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    
    if (decoded) {
      req.user = decoded;
      next();
    } else {
      res.status(403).json({ message: 'Token is not valid' });
    }
  });
}

// Example secured route
const app = express();

app.get('/secure', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'This is a secured endpoint', user: req.user });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});