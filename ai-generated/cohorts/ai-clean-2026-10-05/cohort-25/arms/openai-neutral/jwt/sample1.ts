import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const app = express();
const SECRET_KEY = 'your_secret_key';

export interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token is missing or invalid' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    req.user = user;
    next();
  });
};

app.use(express.json());

app.get('/protected', authenticateJWT, (req: CustomRequest, res: Response) => {
  res.json({ message: 'You have accessed a protected route', user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});