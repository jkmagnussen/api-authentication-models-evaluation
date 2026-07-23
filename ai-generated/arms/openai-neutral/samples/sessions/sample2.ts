import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';

const app = express();

export const sessionConfig = session({
  secret: 'mySuperSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
});

app.use(sessionConfig);

export const sessionLogger = (req: Request, res: Response, next: NextFunction): void => {
  console.log('Session details:', req.session);
  next();
};

app.use(sessionLogger);

app.get('/', (req: Request, res: Response) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  res.send(`Page views: ${req.session.views}`);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});