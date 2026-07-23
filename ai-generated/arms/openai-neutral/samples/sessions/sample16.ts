import express from 'express';
import session, { SessionOptions } from 'express-session';
import path from 'path';

const app = express();

const sessionConfiguration: SessionOptions = {
  secret: process.env.SESSION_SECRET || 'default_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 30, // 30 minutes
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/'
  }
};

app.use(session(sessionConfiguration));

app.get('/', (req, res) => {
  if (req.session) {
    if (!req.session.views) {
      req.session.views = 0;
    }
    req.session.views++;
    res.send(`Number of views: ${req.session.views}`);
  } else {
    res.send('Session not established.');
  }
});

app.post('/login', (req, res) => {
  if (req.session) {
    req.session.userId = 'user123';
    res.send('Logged in successfully!');
  } else {
    res.status(500).send('Session not established.');
  }
});

app.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).send('Error logging out.');
      }
      res.send('Logged out successfully!');
    });
  } else {
    res.status(400).send('Session not found.');
  }
});

export { app };