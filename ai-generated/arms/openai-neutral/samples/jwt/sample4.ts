import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

const secretKey = 'your_super_secret_key';

export const jwtAuthMiddleware = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    req.user = user;
    next();
  });
};

// Sample route to demonstrate middleware usage
export const protectedRoute = (req: CustomRequest, res: Response): void => {
  res.status(200).json({ message: 'Welcome to the protected route!', user: req.user });
};

const app = express();

app.use(express.json());
app.get('/protected', jwtAuthMiddleware, protectedRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});