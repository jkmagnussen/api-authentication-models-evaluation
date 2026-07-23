import express, { Request, Response } from 'express';
import session from 'express-session';
import { SessionOptions } from 'express-session';

const app = express();

const sessionConfig: SessionOptions = {
  secret: 'mySuperSecureSecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 30, // 30 minutes
    secure: false
  }
};

app.use(session(sessionConfig));

app.get('/', (req: Request, res: Response) => {
  if (!req.session.pageViews) {
    req.session.pageViews = 1;
  } else {
    req.session.pageViews += 1;
  }
  res.send(`You have visited this page ${req.session.pageViews} times.`);
});

app.get('/login', (req: Request, res: Response) => {
  req.session.isLoggedIn = true;
  res.send('Logged in successfully!');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to logout.');
    }
    res.send('Logged out successfully!');
  });
});

export { app };