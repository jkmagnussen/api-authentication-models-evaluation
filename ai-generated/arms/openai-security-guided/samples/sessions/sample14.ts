import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionConfig = {
  secret: crypto.randomBytes(64).toString('hex'),
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

export function regenerateSession(req: Request, res: Response, next: NextFunction) {
  req.session.regenerate((err) => {
    if (err) {
      return next(err);
    }
    next();
  });
}

export function invalidateSession(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout failed');
    }
    res.clearCookie('connect.sid');
    res.send('Logged out successfully');
  });
}

export function loginUser(req: Request, res: Response) {
  if (req.body.username && req.body.password) {
    req.session.userId = req.body.username;
    regenerateSession(req, res, () => res.json({ message: 'Logged in.' }));
  } else {
    res.status(400).send('Invalid credentials');
  }
}

app.post('/login', loginUser);
app.post('/logout', invalidateSession);

export default app;