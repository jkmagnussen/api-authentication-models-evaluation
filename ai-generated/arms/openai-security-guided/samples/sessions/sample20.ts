import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionConfig: session.SessionOptions = {
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15, // 15 minutes
    sameSite: 'strict'
  }
};

app.use(session(sessionConfig));

export const regenerateSession = (req: Request, res: Response, next: NextFunction): void => {
  req.session.regenerate((err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

export const logoutAndInvalidate = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('connect.sid', { path: '/' });
    res.status(200).send('Logged out');
  });
};

app.post('/login', regenerateSession, (req: Request, res: Response) => {
  // Authentication logic here
  res.status(200).send('Logged in');
});

app.post('/logout', logoutAndInvalidate);

export default app;