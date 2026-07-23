import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

declare module 'express-session' {
  interface SessionData {
    user: { id: string };
  }
}

const sessionConfig: session.SessionOptions = {
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15, 
    sameSite: 'strict',
  },
};

app.use(session(sessionConfig));

const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).send('Unauthorized');
};

export const loginUser = (req: Request, res: Response) => {
  const { userId } = req.body;
  if (userId) {
    req.session.regenerate((err) => {
      if (err) return res.status(500).send('Error regenerating session');
      req.session.user = { id: userId };
      res.status(200).send('Logged in');
    });
  } else {
    res.status(400).send('Invalid credentials');
  }
};

export const logoutUser = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send('Error logging out');
    res.clearCookie('connect.sid');
    res.status(200).send('Logged out');
  });
};

app.post('/login', loginUser);
app.post('/logout', ensureAuthenticated, logoutUser);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});