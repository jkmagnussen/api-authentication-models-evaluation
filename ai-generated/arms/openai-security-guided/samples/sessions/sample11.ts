import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { randomUUID } from 'crypto';

const app = express();

const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || randomUUID(),
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

const regenerateSession = (req: Request, res: Response, next: NextFunction): void => {
  req.session.regenerate((err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

const destroySession = (req: Request, res: Response, next: NextFunction): void => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
};

app.post('/login', regenerateSession, (req: Request, res: Response) => {
  req.session.userId = req.body.userId; // assume userId is a validated user identifier
  res.status(200).send('Logged in');
});

app.post('/logout', destroySession);

export { app, regenerateSession, destroySession };