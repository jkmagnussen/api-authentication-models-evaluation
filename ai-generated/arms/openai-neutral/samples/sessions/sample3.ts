import express, { Request, Response } from 'express';
import session, { SessionOptions } from 'express-session';

const app = express();

const sessionConfig: SessionOptions = {
  secret: 's3cureS3cretKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 30, // 30 minutes
    httpOnly: true,
    secure: app.get('env') === 'production'
  }
};

app.use(session(sessionConfig));

app.get('/login', (req: Request, res: Response) => {
  req.session.userId = 'user123';
  req.session.isAuthenticated = true;
  res.send('Logged in successfully.');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out.');
    }
    res.clearCookie('connect.sid');
    res.send('Logged out successfully.');
  });
});

app.get('/dashboard', (req: Request, res: Response) => {
  if (req.session.isAuthenticated) {
    res.send(`Welcome, user ${req.session.userId}`);
  } else {
    res.status(401).send('Unauthorized access!');
  }
});

export { app };