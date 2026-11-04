import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-default-secret';

if (!JWT_SECRET) {
  throw new Error('Environment variable JWT_SECRET must be set');
}

export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.user = user as JwtPayload;
    next();
  });
};

const validateInput = (input: string): boolean => {
  const regex = /^[A-Za-z0-9-_]+$/;
  return regex.test(input);
};

app.use(express.json());

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!validateInput(username) || !validateInput(password)) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  const user = { username }; 

  const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });

  res.json({ accessToken });
});

app.get('/protected', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});