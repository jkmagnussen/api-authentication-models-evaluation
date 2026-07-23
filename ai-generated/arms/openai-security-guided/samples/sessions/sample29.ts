import express, { Request, Response, NextFunction } from 'express';
import session, { SessionOptions } from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionConfig: SessionOptions = {
  name: 'sid',
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

export function ensureSessionRegeneration(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.isRegenerated) {
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }
      req.session.isRegenerated = true;
      next();
    });
  } else {
    next();
  }
}

app.use(ensureSessionRegeneration);

export function logoutAndInvalidate(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).send('Error destroying session');
    } else {
      res.clearCookie('sid');
      res.status(200).send('Logged out successfully');
    }
  });
}

app.post('/logout', logoutAndInvalidate);

export { app };