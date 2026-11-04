import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { check, validationResult } from 'express-validator';

dotenv.config();

const app = express();

// Middleware setup
app.use(helmet());
app.use(express.json());

// Session configuration
const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15, // 15 minutes
    sameSite: 'strict',
  },
};

app.use(session(sessionOptions));

// Input validation middleware
const validateUsername = [
  check('username').isAlphanumeric().withMessage('Username must be alphanumeric').trim().escape(),
];

const validatePassword = [
  check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

// Route to login
app.post('/login', validateUsername, validatePassword, (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { username, password } = req.body;

  // Simulate user authentication (replace with real authentication logic)
  if (username === 'validUser' && password === 'validPassword123') {
    req.session.userId = username;
    return res.status(200).json({ message: 'Logged in successfully' });
  } else {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

// Route to access protected resource
app.get('/dashboard', isAuthenticated, (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to your dashboard' });
});

// Logout route
app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app };