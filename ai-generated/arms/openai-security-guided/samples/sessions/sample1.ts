import express from 'express';
import session, { SessionOptions } from 'express-session';

const app = express();

const sessionConfig: SessionOptions = {
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 15 // 15 minutes
  },
  rolling: true
};

app.use(session(sessionConfig));

export const withSessionRegeneration = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session) return next();
  req.session.regenerate((err) => {
    if (err) return next(err);
    next();
  });
};

export const handleLogin = (req: express.Request, res: express.Response) => {
  req.session.userId = req.body.userId;
  req.session.save((err) => {
    if (err) return res.status(500).send('Error saving session');
    res.status(200).send('Logged in');
  });
};

export const handleLogout = (req: express.Request, res: express.Response) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send('Error destroying session');
    res.clearCookie('connect.sid');
    res.status(200).send('Logged out');
  });
};