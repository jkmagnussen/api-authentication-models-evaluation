import express from 'express';
import session from 'express-session';

const app = express();

const sessionConfig = {
  secret: 'superSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 }
};

app.use(session(sessionConfig));

app.get('/', (req, res) => {
  if (!req.session.visits) {
    req.session.visits = 1;
  } else {
    req.session.visits += 1;
  }
  res.send(`Number of visits: ${req.session.visits}`);
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send('Error in logging out');
    }
    res.send('Logged out successfully');
  });
});

export { app };