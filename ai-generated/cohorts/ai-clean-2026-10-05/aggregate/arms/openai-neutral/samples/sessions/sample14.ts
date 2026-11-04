import express from 'express';
import session from 'express-session';
import { Request, Response } from 'express';

declare module 'express-session' {
  interface SessionData {
    views?: number;
    userId?: string;
    isAuthenticated?: boolean;
  }
}

const app = express();

const sessionMiddleware = session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60000,
    secure: false // Set to true if using HTTPS
  }
});

app.use(sessionMiddleware);

app.get('/', (req: Request, res: Response) => {
  if (!req.session.views) {
    req.session.views = 1;
    req.session.isAuthenticated = false;
    res.send('Welcome to the session demo. Refresh!');
  } else {
    req.session.views++;
    res.send(`You have viewed this page ${req.session.views} times`);
  }
});

app.get('/login', (req: Request, res: Response) => {
  req.session.userId = 'user123'; // Simulating a login
  req.session.isAuthenticated = true;
  res.send('You are logged in');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.send('You are logged out');
  });
});

app.get('/status', (req: Request, res: Response) => {
  if (req.session.isAuthenticated) {
    res.send(`User ID: ${req.session.userId}, Logged In: ${req.session.isAuthenticated}`);
  } else {
    res.send('Not logged in');
  }
});

export { app, sessionMiddleware };