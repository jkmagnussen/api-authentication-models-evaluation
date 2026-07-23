import express from 'express';
import session from 'express-session';
import { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();

const sessionMiddleware = session({
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15, // 15 minutes
    sameSite: 'strict'
  },
});

app.use(sessionMiddleware);

export function regenerateSession(req: Request, res: Response, next: () => void): void {
  req.session.regenerate((err) => {
    if (err) {
      res.status(500).send('Session regeneration failed');
    } else {
      next();
    }
  });
}

export function ensureLoggedIn(req: Request, res: Response, next: () => void): void {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
}

export function logOut(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).send('Logout failed');
    } else {
      res.clearCookie('connect.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      res.status(200).send('Logged out');
    }
  });
}

app.post('/login', regenerateSession, (req: Request, res: Response) => {
  // Example login logic
  req.session.user = { id: 1 }; // Simulate an authenticated user
  res.status(200).send('Logged in');
});

app.post('/logout', ensureLoggedIn, logOut);

export default app;