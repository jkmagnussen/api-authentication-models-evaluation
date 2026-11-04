import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const sessionOptions: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: 'lax'
  }
};

app.use(session(sessionOptions));

const validateSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  next();
};

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // Dummy authentication logic
  if (username === 'user' && password === 'password') {
    req.session.userId = username;
    res.status(200).json({ message: 'Logged in successfully' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/protected', validateSession, (req: Request, res: Response) => {
  res.status(200).json({ message: 'You have access' });
});

app.post('/logout', validateSession, (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

export { app };