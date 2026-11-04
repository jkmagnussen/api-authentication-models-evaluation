import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(helmet());

const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

const sessionOptions: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15
  },
  name: 'sessionId'
};

app.use(session(sessionOptions));

app.use(express.json());

const validateInput = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || typeof req.body.username !== 'string') {
    return res.status(400).send('Invalid input');
  }
  next();
};

app.post('/login', validateInput, (req: Request, res: Response) => {
  const username = req.body.username;
  req.session.username = username;
  res.send(`User ${username} logged in`);
});

app.get('/dashboard', (req: Request, res: Response) => {
  if (req.session.username) {
    res.send(`Welcome to your dashboard, ${req.session.username}`);
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to log out');
    }
    res.clearCookie('sessionId');
    res.send('Logged out');
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

export { app };