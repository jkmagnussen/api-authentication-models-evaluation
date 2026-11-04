import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyErrors } from 'jsonwebtoken';

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';

interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send('Access token is missing or invalid');
    return;
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, SECRET_KEY, (err: VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
    if (err) {
      res.status(403).send('Access token is invalid');
      return;
    }

    req.user = decoded;
    next();
  });
};

app.get('/protected', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).send(`Hello, user ${req.user}`);
});

export const startServer = () => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};