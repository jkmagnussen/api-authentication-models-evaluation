import express from 'express';
import session from 'express-session';

const app = express();

app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60000,
    secure: false
  }
}));

app.get('/', (req, res) => {
  if (!req.session.views) {
    req.session.views = 1;
    res.send('Welcome! This is your first visit.');
  } else {
    req.session.views++;
    res.send(`You have visited this page ${req.session.views} times.`);
  }
});

app.post('/login', (req, res) => {
  req.session.user = { username: 'user123' };
  res.send('Logged in successfully.');
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Logout failed.');
    }
    res.send('Logged out successfully.');
  });
});

export { app };