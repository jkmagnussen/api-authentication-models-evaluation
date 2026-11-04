import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const SECRET_KEY = 'your_secret_key';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user as JwtPayload;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Example of a protected route
const app = express();
app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.json({ message: 'You have accessed a protected route', user: req.user });
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});