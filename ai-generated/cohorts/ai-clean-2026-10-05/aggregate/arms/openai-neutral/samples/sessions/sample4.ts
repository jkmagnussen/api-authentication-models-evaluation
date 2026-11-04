import express, { Request, Response } from 'express';
import session from 'express-session';

const app = express();

app.use(express.json());

app.use(session({
  secret: 'your_secret_key', // Replace with a secure key in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.get('/', (req: Request, res: Response) => {
  if (req.session.views) {
    req.session.views++;
    res.send(`Number of views: ${req.session.views}`);
  } else {
    req.session.views = 1;
    res.send('Welcome to the session demo. Refresh!');
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

export const startServer = (port: number) => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};