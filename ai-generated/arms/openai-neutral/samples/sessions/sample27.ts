import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    isLoggedIn?: boolean;
  }
}

const app = express();

const sessionMiddleware = session({
  secret: 'your_super_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 3600000 }
});

app.use(sessionMiddleware);

app.post('/login', (req: Request, res: Response) => {
  const { userId } = req.body;
  req.session.userId = userId;
  req.session.isLoggedIn = true;
  res.send('Logged in successfully');
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.send('Logged out successfully');
  });
});

const sessionChecker = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.isLoggedIn) {
    return next();
  }
  res.status(401).send('Unauthorized');
};

app.get('/dashboard', sessionChecker, (req: Request, res: Response) => {
  res.send(`Welcome User: ${req.session.userId}`);
});

export { app, sessionMiddleware };