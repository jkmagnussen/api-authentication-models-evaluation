import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

export const sessionMiddleware = session({
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15, // 15 minutes
    sameSite: 'strict',
  }
});

export const regenerateSession = (req: Request, res: Response, next: NextFunction) => {
  req.session.regenerate((err: Error | null) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

export const secureLogout = (req: Request, res: Response) => {
  req.session.destroy((err: Error | null) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
    } else {
      res.clearCookie('connect.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      res.status(200).json({ message: 'Logged out successfully' });
    }
  });
};