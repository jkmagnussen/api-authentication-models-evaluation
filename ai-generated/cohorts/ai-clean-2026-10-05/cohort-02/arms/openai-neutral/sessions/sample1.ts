import express, { Request, Response } from 'express';
import session from 'express-session';
import connectMongo from 'connect-mongo';

const MongoStore = connectMongo(session);

const app = express();

app.use(express.json());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    url: 'mongodb://localhost:27017/session-store',
    collection: 'sessions'
  }),
  cookie: { maxAge: 1000 * 60 * 60 }
}));

app.get('/', (req: Request, res: Response) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  res.send(`Number of views: ${req.session.views}`);
});

app.post('/login', (req: Request, res: Response) => {
  const { username } = req.body;
  req.session.username = username;
  res.send(`User ${username} logged in`);
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Could not log out');
    } else {
      res.send('Logged out');
    }
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

export { app };