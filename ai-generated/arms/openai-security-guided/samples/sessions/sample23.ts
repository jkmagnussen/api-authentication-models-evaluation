import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import { promisify } from 'util';

const randomBytesAsync = promisify(crypto.randomBytes);

const app = express();

const sessionOptions: session.SessionOptions = {
  secret: 'yourSecretKeyHere',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 30 // 30 minutes
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

export const setSessionValue = async (req: Request, key: string, value: any) => {
  req.session[key] = value;
};

export const destroySession = (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy(err => {
    if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.sendStatus(200);
  });
};

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    req.session.userId = crypto.randomUUID();
  }
  next();
});

export default app;