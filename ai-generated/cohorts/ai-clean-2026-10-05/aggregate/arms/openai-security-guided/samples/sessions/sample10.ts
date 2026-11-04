import express from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

function validateSessionData(data: any): boolean {
  // Implement necessary validation logic for session data
  return typeof data === 'object' && data !== null;
}

const sessionOptions: session.SessionOptions = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60, // 1 hour
    sameSite: 'strict'
  }
};

app.use(session(sessionOptions));

app.use((req, res, next) => {
  if (!validateSessionData(req.session)) {
    req.session.destroy(err => {
      if (err) return res.status(500).send('Failed to destroy session');
      return res.status(400).send('Invalid session data');
    });
  } else {
    next();
  }
});

app.get('/', (req, res) => {
  req.session.views = (req.session.views || 0) + 1;
  res.send(`Number of views: ${req.session.views}`);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

export { app, validateSessionData, sessionOptions };