import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionConfig: session.SessionOptions = {
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

export function sessionRegenerateMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.regenerate) {
    return next(new Error('Session regeneration is not supported'));
  }
  req.session.regenerate((err: any) => {
    if (err) {
      return next(err);
    }
    next();
  });
}

export function logoutUser(req: Request, res: Response): void {
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Could not log out, please try again.');
    } else {
      res.clearCookie('connect.sid');
      res.redirect('/login');
    }
  });
}

app.post('/logout', logoutUser);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});