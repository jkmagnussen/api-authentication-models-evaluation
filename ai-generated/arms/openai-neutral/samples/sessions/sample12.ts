import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

const sessionConfig: session.SessionOptions = {
  secret: 'mySuperSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: process.env.NODE_ENV === 'production',
  }
};

app.use(session(sessionConfig));

app.get('/login', (req: Request, res: Response, _next: NextFunction) => {
  if (req.session) {
    req.session.userId = 'user123';
    res.send('Logged in successfully');
  } else {
    res.status(500).send('Session not initialized');
  }
});

app.get('/logout', (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.status(500).send('Logout failed');
      } else {
        res.send('Logged out successfully');
      }
    });
  }
});

app.get('/status', (req: Request, res: Response) => {
  if (req.session && req.session.userId) {
    res.send(`User ${req.session.userId} is logged in`);
  } else {
    res.send('User not logged in');
  }
});

export { app, sessionConfig };