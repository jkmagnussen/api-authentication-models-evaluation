import express from 'express';
import session from 'express-session';

const app = express();

const sessionConfig: session.SessionOptions = {
  secret: 'supersecretkey123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  }
};

app.use(session(sessionConfig));

app.get('/login', (req, res) => {
  if (req.session) {
    req.session.userId = 'user123';
    res.send('User logged in and session created');
  } else {
    res.status(500).send('Session error');
  }
});

app.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).send('Error logging out');
      }
      res.send('User logged out');
    });
  } else {
    res.status(500).send('Session error');
  }
});

app.get('/dashboard', (req, res) => {
  if (req.session && req.session.userId) {
    res.send(`Welcome to the dashboard, user: ${req.session.userId}`);
  } else {
    res.status(401).send('Unauthorized access');
  }
});

export { app, sessionConfig };