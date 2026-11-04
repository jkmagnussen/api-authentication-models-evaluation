import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = 'your_secret_key'; // Replace with your actual secret key

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
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

// Usage in an Express app
const app = express();

app.use(express.json());

app.get('/protected', authenticateJWT, (req: Request, res: Response) => {
  res.send('This is a protected route');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});

export default app;