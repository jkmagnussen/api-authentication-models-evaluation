import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'your-secret-key';

// Middleware to authenticate JWT
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

// Sample route that requires authentication
export const securedRoute = (req: Request, res: Response) => {
  res.json({ message: 'This is a secured route', user: req.user });
};

// Express app setup for demonstration
const app = express();
app.use(express.json());

app.get('/protected', authenticateJWT, securedRoute);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});