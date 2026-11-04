import express, { Request, Response } from 'express';
import session from 'express-session';

const app = express();
const PORT = 3000;

const sessionOptions: session.SessionOptions = {
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 60000 // Session max age in milliseconds
  }
};

app.use(session(sessionOptions));

app.get('/', (req: Request, res: Response) => {
  if (req.session) {
    if (!req.session.views) {
      req.session.views = 1;
    } else {
      req.session.views++;
    }
    res.send(`Number of views: ${req.session.views}`);
  } else {
    res.send('Session not found');
  }
});

app.get('/login', (req: Request, res: Response) => {
  if (req.session) {
    req.session.user = 'exampleUser';
    res.send('Logged in');
  } else {
    res.send('Error creating session');
  }
});

app.get('/logout', (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.send('Error destroying session');
      } else {
        res.send('Logged out');
      }
    });
  } else {
    res.send('No session found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { app, sessionOptions };