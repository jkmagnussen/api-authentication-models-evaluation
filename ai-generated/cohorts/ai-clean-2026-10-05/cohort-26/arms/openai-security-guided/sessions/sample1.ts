import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { body, validationResult } from 'express-validator';

const app = express();

const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'defaultSecret', // Secure secret from env
  resave: false,
  saveUninitialized: false, // Do not save empty sessions
  cookie: {
    httpOnly: true, // Mitigate XSS
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 1000 * 60 * 15 // 15 minutes
  }
};

app.use(session(sessionOptions));

const validateSessionData = [
  body('username').isString().isLength({ min: 3, max: 20 }).trim().escape(),
  body('password').isString().isLength({ min: 8 }).trim().escape() // Use strong password policy
];

app.post('/login', validateSessionData, (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); // Fail closed on validation error
  }

  const { username, password } = req.body;

  // Dummy authentication logic
  if (username === 'user' && password === 'securePassword') {
    req.session.user = { username };
    res.status(200).json({ message: 'Logged in successfully' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid', { path: '/' });
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

export { app };