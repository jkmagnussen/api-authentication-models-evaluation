import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60, // 1 hour
    sameSite: 'strict'
  }
};

app.use(helmet());
app.use(express.json());
app.use(session(sessionOptions));

const validateSessionInput = (req: Request, res: Response, next: NextFunction): void => {
  if (typeof req.body.username !== 'string' || req.body.username.trim() === '') {
    res.status(400).send('Invalid username.');
    return;
  }
  next();
};

app.post('/login', validateSessionInput, (req: Request, res: Response) => {
  req.session.user = { username: req.body.username };
  res.send('Logged in successfully.');
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Failed to log out.');
    } else {
      res.send('Logged out successfully.');
    }
  });
});

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).send('Unauthorized.');
};

app.get('/profile', isAuthenticated, (req: Request, res: Response) => {
  res.send(`Welcome to your profile, ${req.session.user?.username}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});