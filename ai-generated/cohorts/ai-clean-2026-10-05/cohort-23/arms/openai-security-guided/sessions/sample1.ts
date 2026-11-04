import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();

const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: 'strict',
  }
};

app.use(helmet());
app.use(express.json());
app.use(session(sessionOptions));

function validateSession(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  if (username === 'admin' && password === 'password') { // Example validation
    req.session.userId = 'adminId';
    res.status(200).json({ message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/logout', validateSession, (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
});

app.get('/protected', validateSession, (req: Request, res: Response) => {
  res.status(200).json({ message: 'This is protected data' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, validateSession };