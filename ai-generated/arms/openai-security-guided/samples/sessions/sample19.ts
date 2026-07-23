import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';

const app = express();

const sessionConfig = {
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 15 // 15 minutes
  }
};

app.use(session(sessionConfig));

app.use(express.json());

export const regenerateSession = (req: Request, res: Response, next: NextFunction) => {
  req.session.regenerate((err: Error) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

export const validateSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }
  next();
};

app.post('/login', [
  body('username').isString().isLength({ min: 3 }),
  body('password').isString().isLength({ min: 8 })
], (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Assume user authentication logic here
  req.session.userId = req.body.username; // Example assignment
  regenerateSession(req, res, () => {
    res.status(200).json({ message: 'Login successful' });
  });
});

app.post('/logout', validateSession, (req: Request, res: Response) => {
  req.session.destroy((err: Error) => {
    if (err) {
      return res.status(500).json({ message: 'Session destruction failed' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logout successful' });
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});