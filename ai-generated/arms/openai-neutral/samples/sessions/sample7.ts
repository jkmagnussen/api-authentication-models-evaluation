import express, { Request, Response } from 'express';
import session from 'express-session';
import { Store } from 'express-session';

const app = express();
const sessionStore: Store = new session.MemoryStore();

app.use(session({
  store: sessionStore,
  secret: 'supersecretkey123',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
}));

app.get('/login', (req: Request, res: Response) => {
  if (req.session) {
    req.session.isAuthenticated = true;
    res.send('Logged in successfully!');
  }
});

app.get('/check', (req: Request, res: Response) => {
  if (req.session && req.session.isAuthenticated) {
    res.send('User is authenticated.');
  } else {
    res.send('User is not authenticated.');
  }
});

app.get('/logout', (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).send('Error logging out.');
      }
      res.send('Logged out successfully.');
    });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export { app, sessionStore };