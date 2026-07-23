import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import { randomBytes } from 'crypto';

const app = express();

const sessionOptions: session.SessionOptions = {
  secret: randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 15 // 15 minutes
  }
};

app.use(session(sessionOptions));

export const regenerateSessionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.session) {
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session regeneration failed.' });
      }
      next();
    });
  } else {
    next();
  }
};

export const handleLogout = (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to destroy session.' });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logout successful.' });
    });
  } else {
    res.status(400).json({ error: 'No active session to logout.' });
  }
};

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (validateCredentials(username, password)) {
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session creation failed.' });
      }
      req.session.user = { username };
      res.status(200).json({ message: 'Login successful.' });
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials.' });
  }
});

const validateCredentials = (username: string, password: string): boolean => {
  // Placeholder for real credential validation logic
  return username === 'admin' && password === 'password';
};

app.post('/logout', handleLogout);

app.use(regenerateSessionMiddleware);