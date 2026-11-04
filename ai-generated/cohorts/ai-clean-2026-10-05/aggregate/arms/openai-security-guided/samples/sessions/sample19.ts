import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware for security headers
app.use(helmet());

// Session configuration
const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
};

app.use(session(sessionOptions));

// Simple input validation function
const validateInput = (input: any, type: 'string' | 'number'): boolean => {
  if (type === 'string' && typeof input === 'string') {
    return /^[a-zA-Z0-9]+$/.test(input); // Alphanumeric check
  }
  if (type === 'number' && typeof input === 'number') {
    return Number.isInteger(input);
  }
  return false;
};

// Middleware to validate session ID
app.use((req, res, next) => {
  if (req.sessionID && !validateInput(req.sessionID, 'string')) {
    return res.status(400).send('Invalid session ID');
  }
  next();
});

// Example route with input validation
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!validateInput(username, 'string') || !validateInput(password, 'string')) {
    return res.status(400).send('Invalid input');
  }

  // Assume user authentication logic here
  req.session.userId = username; // Storing user information in session
  res.send('Logged in successfully');
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Could not log out. Try again.');
    }
    res.clearCookie('connect.sid');
    res.send('Logged out successfully');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { app, validateInput };