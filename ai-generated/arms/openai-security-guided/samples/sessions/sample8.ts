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
    maxAge: 30 * 60 * 1000, // 30 minutes
  }
};

app.use(session(sessionOptions));

export const regenerateSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) return next();
  req.session.regenerate((err) => {
    if (err) return next(err);
    next();
  });
};

export const ensureLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).send('Unauthorized');
};

export const signOut = (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).send('Could not log out');
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  }
};

app.post('/login', (req: Request, res: Response, next: NextFunction) => {
  const userId = authenticateUser(req.body.username, req.body.password); // Implement authentication logic
  if (userId) {
    req.session.userId = userId;
    regenerateSession(req, res, next);
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.get('/logout', signOut);