import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();
const PORT = 3000;

declare module 'express-session' {
  interface SessionData {
    views: number;
  }
}

app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 60000 } // secure should be true in production with HTTPS
}));

app.get('/', (req: Request, res: Response) => {
  if (req.session.views) {
    req.session.views++;
    res.send(`Number of views: ${req.session.views}`);
  } else {
    req.session.views = 1;
    res.send('Welcome! Refresh the page to start tracking views.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export { app };