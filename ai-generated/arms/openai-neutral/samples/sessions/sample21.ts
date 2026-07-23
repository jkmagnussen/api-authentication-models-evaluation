import express, { Request, Response } from 'express';
import session from 'express-session';

const app = express();

app.use(session({
  secret: 'randomSecretKey123!',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));

app.get('/', (req: Request, res: Response) => {
  if (req.session.views) {
    req.session.views++;
    res.send(`Number of visits: ${req.session.views}`);
  } else {
    req.session.views = 1;
    res.send(`Welcome! You've visited this page ${req.session.views} time`);
  }
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.send('Error logging out');
    }
    res.send('Logged out');
  });
});

export { app };