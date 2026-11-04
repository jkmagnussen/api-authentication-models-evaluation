import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();

// Secure default configurations
const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'defaultSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15, // 15 minutes
    sameSite: 'strict'
  }
};

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session(sessionOptions));

const validateSessionInput = (req: Request, res: Response, next: NextFunction) => {
  if (typeof req.body.username !== 'string' || !req.body.username.trim()) {
    return res.status(400).send('Invalid username input');
  }
  if (typeof req.body.password !== 'string' || req.body.password.length < 8) {
    return res.status(400).send('Invalid password input');
  }
  next();
};

app.post('/login', validateSessionInput, (req: Request, res: Response) => {
  const { username } = req.body;
  req.session.user = { username };
  res.send(`User ${username} logged in`);
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('connect.sid');
    res.send('User logged out');
  });
});

app.get('/dashboard', (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized access');
  }
  res.send(`Welcome to your dashboard, ${req.session.user.username}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app };