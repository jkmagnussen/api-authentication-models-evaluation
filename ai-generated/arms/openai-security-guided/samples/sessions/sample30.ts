import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

app.use(session({
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 15 // 15 minutes
  }
}));

export const regenerateSession = (req: Request, res: Response, next: NextFunction) => {
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

export const invalidateSession = (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: 'Error logging out' });
      } else {
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        res.status(200).json({ message: 'Logged out successfully' });
      }
    });
  } else {
    res.status(400).json({ message: 'No session found' });
  }
};

app.post('/login', regenerateSession, (req: Request, res: Response) => {
  // Authentication logic
  // If authenticated:
  req.session.user = { id: 'user123' }; // Example user data
  res.status(200).json({ message: 'Login successful' });
});

app.post('/logout', invalidateSession);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});