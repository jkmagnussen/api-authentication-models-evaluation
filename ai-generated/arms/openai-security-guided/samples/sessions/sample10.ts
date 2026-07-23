import express from 'express';
import session, { SessionOptions } from 'express-session';
import { randomBytes } from 'crypto';

const app = express();

const sessionConfig: SessionOptions = {
  secret: randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
};

app.use(session(sessionConfig));

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (validateUser(username, password)) {
    req.session.regenerate((err) => {
      if (err) {
        res.status(500).send('Failed to create session');
      } else {
        req.session.userId = getUserId(username);
        res.status(200).send('Logged in successfully');
      }
    });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).send('Failed to logout');
    } else {
      res.clearCookie('connect.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      res.status(200).send('Logged out successfully');
    }
  });
});

function validateUser(username: string, password: string): boolean {
  // User validation logic (e.g., check hashed password)
  return true; // Replace with actual validation
}

function getUserId(username: string): number {
  // Get user ID logic
  return 1; // Replace with actual user ID retrieval
}

export { app };