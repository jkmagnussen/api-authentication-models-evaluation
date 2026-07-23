import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionConfig: session.SessionOptions = {
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15, // 15 minutes
    sameSite: 'strict'
  }
};

app.use(session(sessionConfig));

export const regenerateSession = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session) {
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }
      next();
    });
  } else {
    next();
  }
};

export const logoutUser = (req: Request, res: Response): void => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).send('Error logging out');
      } else {
        res.clearCookie('connect.sid', { path: '/' });
        res.status(200).send('Logged out');
      }
    });
  } else {
    res.status(200).send('Logged out');
  }
};

app.post('/login', regenerateSession, (req: Request, res: Response) => {
  // Handle login logic here
  res.send('Logged in');
});

app.post('/logout', logoutUser);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});