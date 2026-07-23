import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { randomBytes } from 'crypto';

const app = express();

const sessionConfig: session.SessionOptions = {
  secret: randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionConfig));

export function isAuthenticated(req: Request): boolean {
  return req.session && req.session.userId ? true : false;
}

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.session.views) {
    req.session.views = 0;
  }
  req.session.views++;
  next();
});

app.post('/login', (req: Request, res: Response) => {
  const { username } = req.body;
  if (username) {
    req.session.userId = username;
    res.status(200).send('Login successful.');
  } else {
    res.status(401).send('Login failed.');
  }
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Error logging out.');
    } else {
      res.status(200).send('Logout successful.');
    }
  });
});

app.get('/status', (req: Request, res: Response) => {
  if (isAuthenticated(req)) {
    res.status(200).send(`Logged in as ${req.session.userId}`);
  } else {
    res.status(401).send('Not logged in.');
  }
});

export { app };