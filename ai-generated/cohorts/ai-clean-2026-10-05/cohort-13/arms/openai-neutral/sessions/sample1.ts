import express from 'express';
import session from 'express-session';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();

const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    secure: process.env.NODE_ENV === 'production'
  }
};

app.use(session(sessionOptions));

app.get('/', (req, res) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  res.send(`Number of views: ${req.session.views}`);
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.send('Logged out successfully');
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

export { app };