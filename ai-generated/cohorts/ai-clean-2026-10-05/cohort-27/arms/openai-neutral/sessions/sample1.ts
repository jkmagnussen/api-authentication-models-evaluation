import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    views?: number;
  }
}

const sessionOptions: session.SessionOptions = {
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
};

app.use(session(sessionOptions));

app.get('/', (req: Request, res: Response) => {
  if (req.session.views) {
    req.session.views++;
    res.send(`Number of views: ${req.session.views}`);
  } else {
    req.session.views = 1;
    res.send('Welcome to the session demo. Refresh!');
  }
});

app.post('/login', (req: Request, res: Response) => {
  req.session.userId = 'user123'; // In reality, you would get this from a database
  res.send('Logged in');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to logout');
    }
    res.send('Logged out');
  });
});

export { app };