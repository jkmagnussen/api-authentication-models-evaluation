import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectRedis from 'connect-redis';
import Redis from 'ioredis';

const RedisStore = connectRedis(session);
const app = express();

const redisClient = new Redis({
  host: 'localhost',
  port: 6379,
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set true if using HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
}));

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the session management example!');
});

app.get('/login', (req: Request, res: Response) => {
  req.session.user = { username: 'exampleUser' };
  res.send('User logged in and session created.');
});

app.get('/profile', (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    res.send(`Hello, ${req.session.user.username}`);
  } else {
    res.status(401).send('Unauthorized access. Please log in.');
  }
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to log out.');
    }
    res.send('User logged out and session destroyed.');
  });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

export { app };