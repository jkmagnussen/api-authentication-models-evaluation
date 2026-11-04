import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const app = express();
const secretKey = 'your_secret_key';

export interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
};

app.use(express.json());

app.get('/protected', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});