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
    maxAge: 1000 * 60 * 30, // 30 minutes
    sameSite: 'strict'
  }
};

app.use(session(sessionOptions));

const regenerateSession = (req: Request, callback: () => void): void => {
  req.session.regenerate(err => {
    if (err) {
      console.error('Session regeneration error:', err);
    }
    callback();
  });
};

const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const login = (req: Request, res: Response): void => {
  const { userId } = req.body;
  if (userId) {
    regenerateSession(req, () => {
      req.session.userId = userId;
      res.json({ message: 'Login successful' });
    });
  } else {
    res.status(400).json({ error: 'Invalid credentials' });
  }
};

const logout = (req: Request, res: Response): void => {
  req.session.destroy(err => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
};

app.post('/login', login);
app.post('/logout', authenticateUser, logout);

export { app, authenticateUser, sessionOptions, regenerateSession, login, logout };