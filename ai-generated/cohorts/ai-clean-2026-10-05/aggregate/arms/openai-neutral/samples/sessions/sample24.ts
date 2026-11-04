import express from 'express';
import session from 'express-session';
import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    isAuthenticated?: boolean;
  }
}

const app = express();

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.json());

export const login = (req: Request, res: Response) => {
  const { userId } = req.body;
  if (userId) {
    req.session.userId = userId;
    req.session.isAuthenticated = true;
    res.send('Login successful');
  } else {
    res.status(400).send('User ID is required');
  }
};

export const logout = (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Could not log out');
    } else {
      res.send('Logout successful');
    }
  });
};

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.status(401).send('Unauthorized');
};

app.post('/login', login);
app.post('/logout', logout);

app.get('/protected', isAuthenticated, (req: Request, res: Response) => {
  res.send('This is protected content');
});

export const server = app.listen(3000, () => {
  console.log('Server is running on port 3000');
});