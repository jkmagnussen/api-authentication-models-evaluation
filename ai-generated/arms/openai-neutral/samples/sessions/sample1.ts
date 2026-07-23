import express, { Request, Response } from 'express';
import session from 'express-session';
import connectRedis from 'connect-redis';
import redis from 'redis';

const app = express();
const RedisStore = connectRedis(session);
const redisClient = redis.createClient();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 60000 }
}));

app.get('/', (req: Request, res: Response) => {
  if (req.session.views) {
    req.session.views++;
  } else {
    req.session.views = 1;
  }
  res.send(`You have visited this page ${req.session.views} times`);
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error destroying session');
    }
    res.send('Session ended');
  });
});

export { app };