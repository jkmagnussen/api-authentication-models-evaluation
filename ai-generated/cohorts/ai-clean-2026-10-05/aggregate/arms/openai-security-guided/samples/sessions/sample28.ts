import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60, // 1 hour
    sameSite: 'strict'
  }
};

app.use(session(sessionOptions));

export const validateSessionInput = (req: Request, res: Response, next: NextFunction) => {
  if (typeof req.body === 'object' && req.body !== null) {
    return next();
  }
  return res.status(400).json({ error: 'Invalid input' });
};

app.post('/login', validateSessionInput, (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (validateUserCredentials(username, password)) {
    req.session.regenerate(err => {
      if (err) return res.status(500).json({ error: 'Session regeneration failed' });

      req.session.user = { username };
      req.session.save(err => {
        if (err) return res.status(500).json({ error: 'Session save failed' });

        res.status(200).json({ message: 'Login successful' });
      });
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });

    res.status(200).json({ message: 'Logout successful' });
  });
});

const validateUserCredentials = (username: string, password: string): boolean => {
  // Implement your user validation logic here
  return username === 'user' && password === 'pass';
};

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;