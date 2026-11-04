import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET_KEY || 'your-secure-default-secret-key';

interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    req.user = user;
    next();
  });
};

export const generateToken = (userId: string) => {
  const payload = { sub: userId };
  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};

const app = express();

app.use(express.json());

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Assume user validation logic here
  const userId = 'exampleUserId'; // Example user ID from database
  const token = generateToken(userId);

  res.json({ token });
});

app.get('/protected', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

export { app };