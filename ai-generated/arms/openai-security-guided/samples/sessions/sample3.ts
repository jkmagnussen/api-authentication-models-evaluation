import express from 'express';
import session from 'express-session';
import { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    regenerated?: boolean;
  }
}

const sessionConfig = {
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
};

app.use(session(sessionConfig));

export const regenerateSession = (req: Request, res: Response, next: () => void) => {
  if (req.session.regenerated) {
    return next();
  }
  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    req.session.regenerated = true;
    next();
  });
};

export const destroySession = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('connect.sid');
    res.status(200).send('Successfully logged out');
  });
};

app.post('/login', (req: Request, res: Response) => {
  req.session.userId = req.body.userId;
  res.status(200).send('Logged in');
});

app.post('/logout', destroySession);

app.use(regenerateSession);

// Example route
app.get('/dashboard', (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized');
  }
  res.status(200).send('Welcome to your dashboard');
});

export const server = app.listen(3000, () => {
  console.log('Server listening on port 3000');
});