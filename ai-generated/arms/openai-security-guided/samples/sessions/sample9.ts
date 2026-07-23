import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionSecret = crypto.randomBytes(64).toString('hex');

const sessionOptions: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30, // 30 minutes
    sameSite: 'strict'
  }
};

app.use(session(sessionOptions));

export const regenerateSession = (req: Request, res: Response, next: NextFunction): void => {
  req.session.regenerate((err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

export const logoutUser = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).send('Failed to destroy session');
    } else {
      res.clearCookie('connect.sid', sessionOptions.cookie);
      res.status(200).send('Successfully logged out');
    }
  });
};

app.post('/login', regenerateSession, (req: Request, res: Response) => {
  // Assume user authentication is done here
  req.session.userId = 'authenticatedUserId';
  res.send('Logged in and session regenerated');
});

app.post('/logout', logoutUser);

export default app;