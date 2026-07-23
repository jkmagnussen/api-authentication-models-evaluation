import * as express from 'express';
import * as session from 'express-session';

const app = express();

const sessionConfig: session.SessionOptions = {
  secret: 'mySuperSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    secure: false, // should be true in a production environment with HTTPS
  }
};

app.use(session(sessionConfig));

app.get('/', (req, res) => {
  if (req.session.views) {
    req.session.views++;
    res.send(`Welcome back! You have visited ${req.session.views} times.`);
  } else {
    req.session.views = 1;
    res.send('Hello there! This is your first visit.');
  }
});

export { app };