import express, { Request, Response } from 'express';
import session from 'express-session';

const sessionMiddleware = session({
  secret: 'topsecretcode',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  }
});

export const app = express();

app.use(sessionMiddleware);

app.get('/login', (req: Request, res: Response) => {
  if (req.session) {
    req.session.userId = 'user123';
    res.send('Logged in!');
  } else {
    res.status(500).send('Session not available.');
  }
});

app.get('/logout', (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.status(500).send('Failed to destroy session.');
      } else {
        res.send('Logged out!');
      }
    });
  } else {
    res.status(500).send('Session not available.');
  }
});

app.get('/status', (req: Request, res: Response) => {
  if (req.session && req.session.userId) {
    res.send(`User is logged in as ${req.session.userId}`);
  } else {
    res.send('User is not logged in.');
  }
});