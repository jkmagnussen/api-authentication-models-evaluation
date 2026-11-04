import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === 'user' && password === 'pass') {
    req.session.user = { username };
    res.send('Logged in!');
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.get('/profile', (req: Request, res: Response) => {
  if (req.session.user) {
    res.send(`Welcome, ${req.session.user.username}`);
  } else {
    res.status(401).send('Please log in');
  }
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    res.send('Logged out');
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

export { app };