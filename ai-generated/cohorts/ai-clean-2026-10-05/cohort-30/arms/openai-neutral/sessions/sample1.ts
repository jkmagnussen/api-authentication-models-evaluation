import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

declare module 'express-session' {
  interface SessionData {
    views: number;
  }
}

const sessionOptions: session.SessionOptions = {
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 60000 // Session expires after 1 minute of inactivity
  }
};

app.use(session(sessionOptions));

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  if (req.session.views) {
    req.session.views++;
  } else {
    req.session.views = 1;
  }
  res.send(`Number of views: ${req.session.views}`);
});

app.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy(err => {
    if (err) {
      return next(err);
    }
    res.send('Session destroyed');
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export { app, sessionOptions };