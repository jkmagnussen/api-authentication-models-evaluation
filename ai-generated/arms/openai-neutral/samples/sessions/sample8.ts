import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));

const checkSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    return next(new Error('Session not initialized'));
  }
  next();
};

app.post('/login', checkSession, (req: Request, res: Response) => {
  if (req.body.username && req.body.password) {
    req.session.user = req.body.username;
    return res.send(`Logged in as ${req.session.user}`);
  }
  res.status(400).send('Invalid credentials');
});

app.get('/logout', checkSession, (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to destroy session');
    }
    res.send('Logged out successfully');
  });
});

app.get('/status', checkSession, (req: Request, res: Response) => {
  if (req.session.user) {
    res.send(`User ${req.session.user} is logged in`);
  } else {
    res.status(401).send('Not logged in');
  }
});

export { app };