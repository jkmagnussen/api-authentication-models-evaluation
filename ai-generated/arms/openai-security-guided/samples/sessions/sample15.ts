import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const sessionConfig: session.SessionOptions = {
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 15 // 15 minutes
  }
};

const app = express();
app.use(session(sessionConfig));

export const handleLogin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session) {
    return next(new Error('Session is not initialized'));
  }

  req.session.regenerate(err => {
    if (err) return next(err);
    req.session.userId = 'user123';
    res.send('Logged In');
  });
};

export const handleLogout = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) return next(err);
      res.clearCookie('connect.sid');
      res.send('Logged Out');
    });
  } else {
    res.status(400).send('No active session');
  }
};

app.post('/login', handleLogin);
app.post('/logout', handleLogout);

export default app;