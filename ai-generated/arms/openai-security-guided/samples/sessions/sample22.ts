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
    sameSite: 'strict',
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
};

app.use(session(sessionOptions));

export const regenerateSession = (req: Request, res: Response, next: NextFunction): void => {
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
};

export const verifySession = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).send('Unauthorized');
};

export const userLogout = (req: Request, res: Response): void => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send('Could not log out');
      }
      res.clearCookie('connect.sid');
      res.status(200).send('Logged out');
    });
  } else {
    res.status(200).send('No active session');
  }
};

app.post('/login', regenerateSession, (req: Request, res: Response) => {
  if (req.session) {
    req.session.userId = 'user-id-placeholder'; // This should be set to a real user ID after authentication
    res.status(200).send('Logged in');
  }
});

app.post('/logout', userLogout);

app.get('/protected', verifySession, (req: Request, res: Response) => {
  res.status(200).send('Protected content');
});

export default app;