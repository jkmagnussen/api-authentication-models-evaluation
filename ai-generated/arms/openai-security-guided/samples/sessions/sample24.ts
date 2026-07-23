import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionConfig = {
  name: 'sessionId',
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

export const regenerateSession = (req: Request, res: Response, next: NextFunction): void => {
  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).send('Session regeneration error');
    }
    next();
  });
};

export const loginHandler = (req: Request, res: Response): void => {
  req.session.userId = 'user123';
  regenerateSession(req, res, () => {
    res.send('Logged in and session regenerated');
  });
};

export const logoutHandler = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout error');
    }
    res.clearCookie('sessionId');
    res.send('Logged out successfully');
  });
};

app.post('/login', loginHandler);
app.post('/logout', logoutHandler);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});