import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

const sessionOptions: session.SessionOptions = {
  secret: sessionSecret,
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

const validateSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    return res.status(400).send('Session not initialized.');
  }
  next();
};

app.use(validateSession);

app.get('/', (req: Request, res: Response) => {
  res.send('Session Management Initialized');
});

app.get('/login', (req: Request, res: Response) => {
  const { user } = req.query;
  if (typeof user !== 'string' || !user.trim()) {
    return res.status(400).send('Invalid user input.');
  }
  req.session.user = user;
  res.send(`User ${user} logged in.`);
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to terminate session.');
    }
    res.send('Logged out successfully.');
  });
});

export { app };