import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

app.use(helmet());
app.use(bodyParser.json());

const sessionOptions: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30, // 30 minutes
  }
};

app.use(session(sessionOptions));

interface User {
  username: string;
  passwordHash: string;
}

const users: User[] = [
  // Sample user with precomputed password hash
  { username: 'user1', passwordHash: crypto.createHash('sha256').update('password123').digest('hex') }
];

const validateInput = (username: string, password: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_.-]*$/;
  const isUsernameValid = usernameRegex.test(username) && username.length <= 100;
  const isPasswordValid = password.length >= 8;
  return isUsernameValid && isPasswordValid;
};

const authenticateUser = (username: string, password: string): boolean => {
  const user = users.find(user => user.username === username);
  if (!user) return false;
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  return user.passwordHash === passwordHash;
};

app.post('/login', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!validateInput(username, password)) {
      res.status(400).send('Invalid input');
      return;
    }

    if (authenticateUser(username, password)) {
      req.session.user = { username };
      res.status(200).send('Login successful');
    } else {
      res.status(401).send('Unauthorized');
    }
  } catch (err) {
    next(err);
  }
});

app.get('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).send('Could not log out');
    } else {
      res.status(200).send('Logout successful');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, sessionOptions, validateInput, authenticateUser };