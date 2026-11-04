import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

const app = express();

// Middleware for setting security headers
app.use(helmet());

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Session management configuration
app.use(session({
  name: 'sessionId',
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000 // 1 hour
  }
}));

// Input validation middleware
const validateInput = [
  body('username').isString().isLength({ min: 3 }).trim(),
  body('password').isString().isLength({ min: 6 })
];

// Middleware for handling validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Login route
app.post('/login', validateInput, handleValidationErrors, (req: Request, res: Response) => {
  // Simulate authentication logic
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password123') {
    req.session.user = { username };
    return res.status(200).json({ message: 'Login successful' });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

// Logout route
app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('sessionId');
    res.status(200).json({ message: 'Logout successful' });
  });
});

// Protected route
app.get('/dashboard', (req: Request, res: Response) => {
  if (req.session.user) {
    return res.status(200).json({ message: `Welcome ${req.session.user.username}` });
  }
  res.status(403).json({ message: 'Unauthorized access' });
});

export { app };