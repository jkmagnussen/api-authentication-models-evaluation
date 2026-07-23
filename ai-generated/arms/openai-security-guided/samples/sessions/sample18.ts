import express, { Request, Response } from 'express';
import session, { SessionOptions } from 'express-session';
import { randomBytes } from 'crypto';
import helmet from 'helmet';

const app = express();

app.use(helmet());

const sessionConfig: SessionOptions = {
  secret: randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15,
    sameSite: 'lax'
  }
};

app.use(session(sessionConfig));

export function regenerateSession(req: Request, res: Response, next: () => void): void {
  req.session.regenerate(err => {
    if (err) {
      res.status(500).send('Session regeneration failed');
    } else {
      next();
    }
  });
}

export function ensureAuthenticated(req: Request, res: Response, next: () => void): void {
  if (req.session.userId) {
    return next();
  } else {
    res.status(401).send('Unauthorized');
  }
}

export function logOut(req: Request, res: Response): void {
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Unable to log out');
    } else {
      res.clearCookie('connect.sid');
      res.status(200).send('Logged out successfully');
    }
  });
}

app.post('/login', (req: Request, res: Response) => {
  // Assume user authentication logic
  req.session.userId = 'user123'; // This should be set to the actual user ID
  res.status(200).send('Logged in successfully');
});

app.post('/logout', logOut);

app.use('/secure-endpoint', ensureAuthenticated, (req: Request, res: Response) => {
  res.status(200).send('Secure data accessed');
});

app.use(regenerateSession);

export default app;