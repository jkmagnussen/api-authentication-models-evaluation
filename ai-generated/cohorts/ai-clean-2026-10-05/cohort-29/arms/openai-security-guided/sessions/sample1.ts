import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

const app = express();

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

app.use(express.json());

const sessionOptions: session.SessionOptions = {
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
};

app.use(session(sessionOptions));

function loginValidationMiddleware(req: Request, res: Response, next: NextFunction) {
  body('username').isString().isLength({ min: 4, max: 20 }).trim().escape()(req, res, () => {});
  body('password').isString().isLength({ min: 8 }).trim().escape()(req, res, () => {});
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

app.post('/login', loginValidationMiddleware, (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Mock authentication logic
  if (username === 'validUser' && password === 'validPassword') {
    req.session.userId = '12345';
    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});