import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware to secure HTTP headers
app.use(helmet());

// Session configuration
const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'defaultSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15, // 15 minutes
    sameSite: 'strict'
  }
};

app.use(session(sessionOptions));

// Middleware to validate session data
function validateSessionData(req: Request, res: Response, next: NextFunction): void {
  if (!req.session) {
    return res.status(500).send('Session middleware not initialized');
  }
  next();
}

app.use(validateSessionData);

// Helper function to validate user input
function isValidInput(input: any): boolean {
  // Implement input validation logic here
  return typeof input === 'string' && input.trim().length > 0;
}

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!isValidInput(username) || !isValidInput(password)) {
    return res.status(400).send('Invalid input');
  }

  // Authenticate user (simplified example)
  if (username === 'user' && password === 'pass') {
    req.session.regenerate((err) => {
      if (err) return res.status(500).send('Session regeneration failed');
      req.session.user = username;
      res.status(200).send('Logged in');
    });
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send('Logout failed');
    res.status(200).send('Logged out');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, validateSessionData, isValidInput };