import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secure-default-key';

interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

export const jwtAuthMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token is invalid or expired' });
    }
    req.user = decoded;
    next();
  });
};

export const validateInput = (input: any, schema: any): boolean => {
  const { error } = schema.validate(input);
  return !error;
};

const app = express();

app.use(express.json());

app.post('/secure-endpoint', jwtAuthMiddleware, (req: CustomRequest, res: Response) => {
  if (!req.user) {
    return res.status(403).json({ message: 'User not authorized' });
  }
  res.status(200).json({ message: 'Welcome to the secure endpoint!', user: req.user });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});