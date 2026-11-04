import express from 'express';
import session from 'express-session';

const app = express();

declare module 'express-session' {
  interface SessionData {
    user: { id: string, name: string };
  }
}

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Note: Set secure to true if using HTTPS
}));

app.post('/login', (req, res) => {
  const { userId, username } = req.body;
  if (userId && username) {
    req.session.user = { id: userId, name: username };
    res.send('User logged in');
  } else {
    res.status(400).send('Invalid login');
  }
});

app.get('/profile', (req, res) => {
  if (req.session.user) {
    res.send(`Hello, ${req.session.user.name}`);
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.send('User logged out');
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app };