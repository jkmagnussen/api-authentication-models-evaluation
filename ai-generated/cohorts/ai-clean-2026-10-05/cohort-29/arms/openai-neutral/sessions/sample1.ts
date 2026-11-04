import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { SessionOptions } from 'express-session';

const app = express();
const PORT = 3000;

const sessionOptions: SessionOptions = {
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
};

app.use(session(sessionOptions));

app.get('/', (req: Request, res: Response) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  res.send(`Number of views: ${req.session.views}`);
});

app.get('/login', (req: Request, res: Response) => {
  req.session.userId = 'user123';
  res.send('User logged in, session created.');
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    res.send('User logged out, session ended.');
  });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).send('Unauthorized, please log in.');
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { app, sessionOptions };