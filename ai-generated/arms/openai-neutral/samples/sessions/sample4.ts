import express from 'express';
import session from 'express-session';

const app = express();

const sessionConfiguration = {
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  }
};

declare module 'express-session' {
  interface SessionData {
    userID: string;
    isLoggedIn: boolean;
  }
}

app.use(session(sessionConfiguration));

app.post('/login', (req, res) => {
  const { userID } = req.body;
  if (userID) {
    req.session.userID = userID;
    req.session.isLoggedIn = true;
    res.status(200).send('Login successful');
  } else {
    res.status(401).send('Invalid login');
  }
});

app.get('/dashboard', (req, res) => {
  if (req.session.isLoggedIn) {
    res.status(200).send(`Welcome User ${req.session.userID}`);
  } else {
    res.status(401).send('Please login to access this page');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to logout');
    }
    res.status(200).send('Logged out successfully');
  });
});

export { app as sessionApp };