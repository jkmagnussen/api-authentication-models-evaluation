import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 15, // 15 minutes
  }
};

app.use(session(sessionOptions));

export const regenerateSession = (req: Request, res: Response, next: NextFunction) => {
  req.session.regenerate((err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

export const invalidateSession = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(200).json({ message: 'Logout successful' });
  });
};

app.post('/login', regenerateSession, (req: Request, res: Response) => {
  // Authentication logic here
  req.session.userId = 'user-id';
  res.status(200).json({ message: 'Login successful' });
});

app.post('/logout', invalidateSession);

export default app;