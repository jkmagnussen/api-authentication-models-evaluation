import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

app.use(express.json());

const sessionOptions: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60, // 1 hour
  },
};

app.use(session(sessionOptions));

// Middleware to validate session
function validateSession(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Unauthorized access' });
  } else {
    next();
  }
}

// Basic input validation middleware
function validateInput(req: Request, res: Response, next: NextFunction): void {
  if (typeof req.body.username !== 'string' || typeof req.body.password !== 'string') {
    res.status(400).json({ error: 'Invalid input' });
  } else {
    next();
  }
}

// Login route
app.post('/login', validateInput, (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Placeholder for actual authentication logic
  if (username === 'admin' && password === 'password') {
    req.session.userId = 1; // Simulated user ID
    res.json({ message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Protected route example
app.get('/dashboard', validateSession, (req: Request, res: Response) => {
  res.json({ message: 'Welcome to your dashboard!' });
});

// Logout route
app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).json({ error: 'Could not log out, please try again' });
    } else {
      res.json({ message: 'Logout successful' });
    }
  });
});

export default app;