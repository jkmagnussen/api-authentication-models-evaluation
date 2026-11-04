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
    sameSite: 'lax'
  }
};

app.use(session(sessionOptions));

const isValidSessionUser = (userId: any): boolean => {
  return typeof userId === 'string' && /^[a-zA-Z0-9]+$/.test(userId);
};

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId || !isValidSessionUser(req.session.userId)) {
    req.session.destroy((err) => {
      if (err) console.error('Failed to destroy session:', err);
      return res.status(401).send('Invalid session');
    });
  } else {
    next();
  }
});

app.post('/login', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!isValidSessionUser(userId)) {
    return res.status(400).send('Invalid user input');
  }

  req.session.userId = userId;
  return res.status(200).send('Logged in successfully');
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session:', err);
      return res.status(500).send('Failed to log out');
    }
    res.clearCookie('connect.sid');
    return res.status(200).send('Logged out successfully');
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

export { app, sessionOptions };