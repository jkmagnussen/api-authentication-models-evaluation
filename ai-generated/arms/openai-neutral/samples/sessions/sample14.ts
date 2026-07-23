import express, { Request, Response } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

const app = express();

declare module 'express-session' {
  interface SessionData {
    userID: string;
    isAuthenticated: boolean;
  }
}

const sessionConfig = {
  genid: () => uuidv4(),
  secret: 'mySuperSecureSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000,
  },
};

app.use(session(sessionConfig));

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  // Placeholder authentication logic
  if (username === 'admin' && password === 'password') {
    req.session.userID = 'admin-123';
    req.session.isAuthenticated = true;
    res.send('Logged in successfully.');
  } else {
    res.status(401).send('Authentication failed.');
  }
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    res.send('Logged out successfully.');
  });
});

app.get('/profile', (req: Request, res: Response) => {
  if (req.session.isAuthenticated) {
    res.send(`User ID: ${req.session.userID}`);
  } else {
    res.status(401).send('Unauthorized access.');
  }
});

export { app };