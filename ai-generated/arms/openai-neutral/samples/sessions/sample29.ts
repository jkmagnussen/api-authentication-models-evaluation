import express from 'express';
import session from 'express-session';

const app = express();

const sessionSettings = {
  secret: 'mySecretKey123!',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
};

app.use(session(sessionSettings));

const sessionChecker = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/dashboard', sessionChecker, (req, res) => {
  res.send('Welcome to your dashboard!');
});

app.post('/login', (req, res) => {
  // Dummy credentials - replace with real authentication logic
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    req.session.user = { username };
    res.redirect('/dashboard');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');
  });
});

export { app, sessionChecker };