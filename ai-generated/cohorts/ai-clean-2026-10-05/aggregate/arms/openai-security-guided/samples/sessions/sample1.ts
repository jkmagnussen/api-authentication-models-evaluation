import express, { Request, Response } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import crypto from 'crypto';

export const app = express();

// Secure session configuration
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

// Middleware setup
app.use(helmet());
app.use(express.json());
app.use(session(sessionOptions));

// Simple validation function
const isValidSessionData = (data: any): boolean => {
  return typeof data === 'string' && data.length > 0;
};

// Middleware to check for valid session
app.use((req: Request, res: Response, next) => {
  if (!req.session) {
    return res.status(500).send('Session is not configured properly.');
  }
  next();
});

// Route example
app.post('/login', (req: Request, res: Response) => {
  const { username } = req.body;
  if (!isValidSessionData(username)) {
    return res.status(400).send('Invalid input.');
  }
  req.session.user = username;
  res.send('Logged in successfully.');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Logout failed.');
    }
    res.send('Logged out successfully.');
  });
});