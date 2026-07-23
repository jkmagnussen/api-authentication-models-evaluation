import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import { randomBytes } from 'crypto';

export const sessionMiddleware = session({
  secret: randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60000, // 1 minute for demonstration
    sameSite: 'strict'
  }
});

export const regenerateSession = (req: Request, res: Response, next: NextFunction) => {
  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regeneration failed:', err);
      return res.status(500).send('Internal Server Error');
    }
    next();
  });
};

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.status(401).send('Unauthorized');
};

export const userLogout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction failed:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.clearCookie('connect.sid', { path: '/' });
    res.status(200).send('Logged Out');
  });
};

const app = express();
app.use(sessionMiddleware);

// Sample route setup
app.post('/login', regenerateSession, (req, res) => {
  req.session.isAuthenticated = true;
  res.status(200).send('Logged In');
});

app.post('/logout', authenticateUser, userLogout);

app.get('/secure-data', authenticateUser, (req, res) => {
  res.status(200).send('Secure Data');
});

export default app;