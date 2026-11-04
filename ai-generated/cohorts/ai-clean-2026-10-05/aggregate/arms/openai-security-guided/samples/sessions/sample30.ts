import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { body, validationResult } from 'express-validator';

const app = express();

const SESSION_SECRET = process.env.SESSION_SECRET || 'change_this_secret';
const COOKIE_MAX_AGE = 1000 * 60 * 60; // 1 hour

app.use(express.json());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE
  }
}));

app.post('/login', 
  body('username').isString().isLength({ min: 5 }),
  body('password').isString().isLength({ min: 8 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
    if (authenticateUser(username, password)) {
      req.session.userId = username;
      return res.status(200).json({ message: 'Logged in successfully' });
    }
    res.status(401).json({ message: 'Invalid credentials' });
  }
);

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

function authenticateUser(username: string, password: string): boolean {
  // Implement actual user authentication
  return username === 'testuser' && password === 'testpassword';
}

export { app };