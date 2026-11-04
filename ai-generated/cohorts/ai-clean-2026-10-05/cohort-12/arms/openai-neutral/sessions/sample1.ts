import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { SessionOptions } from 'express-session';

const app = express();

const sessionOptions: SessionOptions = {
  secret: 'yourSecretKey', // replace with a strong secret in production
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // set to true in production with HTTPS
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
};

app.use(session(sessionOptions));

export const login = (req: Request, res: Response): void => {
  // Dummy login logic
  req.session.userId = 'user1234'; // Example user ID
  res.send('User logged in');
};

export const logout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('connect.sid');
    res.send('User logged out');
  });
};

export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).send('Unauthorized');
};

app.post('/login', login);
app.post('/logout', logout);

app.get('/profile', isAuthenticated, (req: Request, res: Response) => {
  res.send(`Welcome user: ${req.session.userId}`);
});

export default app;