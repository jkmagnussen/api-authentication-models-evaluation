import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionOptions: session.SessionOptions = {
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
};

app.use(session(sessionOptions));

export function refreshSession(req: Request, res: Response, next: NextFunction): void {
  if (req.session) {
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }
      next();
    });
  } else {
    next();
  }
}

export function terminateSession(req: Request, res: Response, next: NextFunction): void {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('connect.sid', sessionOptions.cookie);
      res.status(204).send();
    });
  } else {
    res.status(204).send();
  }
}

app.post('/login', refreshSession, (req: Request, res: Response) => {
  if (req.session) {
    req.session.userId = 'secureUserId'; // Example userId assignment
    res.status(200).send('Session refreshed!');
  } else {
    res.status(500).send('Session not established.');
  }
});

app.post('/logout', terminateSession);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});