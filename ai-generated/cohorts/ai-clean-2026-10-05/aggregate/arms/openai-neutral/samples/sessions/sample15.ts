import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    views?: number;
  }
}

const sessionMiddleware = session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
});

app.use(sessionMiddleware);

app.get('/', (req: Request, res: Response) => {
  if (req.session.views) {
    req.session.views++;
    res.send(`<p>Views: ${req.session.views}</p>`);
  } else {
    req.session.views = 1;
    res.send('Welcome to the session demo. Refresh!');
  }
});

app.get('/login', (req: Request, res: Response) => {
  req.session.userId = 'user123';
  res.send('User logged in');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.send('User logged out');
  });
});

app.get('/profile', (req: Request, res: Response) => {
  if (req.session.userId) {
    res.send('Profile page of user: ' + req.session.userId);
  } else {
    res.status(401).send('Please log in to view this page');
  }
});

export default app;