import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { SessionOptions } from 'express-session';

const app = express();

const sessionOptions: SessionOptions = {
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    secure: process.env.NODE_ENV === 'production',
  },
};

app.use(session(sessionOptions));

app.get('/', (req: Request, res: Response) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  res.send(`Number of views: ${req.session.views}`);
});

app.get('/login', (req: Request, res: Response) => {
  req.session.user = { username: 'sampleUser' };
  res.send('User logged in');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Error logging out');
    } else {
      res.send('User logged out');
    }
  });
});

app.get('/profile', (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    res.send(`Welcome, ${req.session.user.username}`);
  } else {
    res.status(401).send('Please log in to view this page');
  }
});

export { app };