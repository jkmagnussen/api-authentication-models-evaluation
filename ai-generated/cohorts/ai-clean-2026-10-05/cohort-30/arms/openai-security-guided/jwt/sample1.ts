import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-default-jwt-secret';

interface CustomRequest extends Request {
  user?: JwtPayload | string;
}

export const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  });
};

app.use(express.json());

app.get('/secure-endpoint', authenticateJWT, (req: CustomRequest, res: Response) => {
  res.status(200).json({ message: 'Authorized access', user: req.user });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});