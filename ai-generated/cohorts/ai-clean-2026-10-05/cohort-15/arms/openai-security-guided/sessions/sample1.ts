import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(helmet());

app.use(express.json());

const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60,
    sameSite: 'strict'
  }
};

app.use(session(sessionOptions));

const validateSessionInput = (input: any): boolean => {
  if (typeof input !== 'object' || input === null) return false;
  
  if (typeof input.username !== 'string' || input.username.length === 0) return false;
  if (typeof input.password !== 'string' || input.password.length === 0) return false;
  
  return true;
};

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!validateSessionInput(req.body)) {
    return res.status(400).send({ error: 'Invalid input' });
  }

  // Simulate user authentication
  if (username === 'user' && password === 'password') {
    req.session.user = { username };
    return res.status(200).send({ message: 'Logged in successfully' });
  } else {
    return res.status(401).send({ error: 'Invalid credentials' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).send({ message: 'Logged out successfully' });
  });
});

export { app };