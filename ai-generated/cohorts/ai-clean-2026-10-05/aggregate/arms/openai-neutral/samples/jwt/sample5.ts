import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET_KEY = 'your-secret-key';

interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing or invalid' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    req.user = decoded;
    next();
  });
};

const app = express();
app.use(express.json());

app.get('/protected', authenticateJWT, (req: CustomRequest, res: Response) => {
  res.json({ message: `Hello, ${req.user}` });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});