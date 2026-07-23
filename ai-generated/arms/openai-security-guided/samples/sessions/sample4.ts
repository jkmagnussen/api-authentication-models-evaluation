import express, { Request, Response } from 'express';
import session from 'express-session';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Define session options
const sessionOptions: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60, // 1 hour
    sameSite: 'lax',
  },
};

app.use(session(sessionOptions));

// Middleware to regenerate session ID on login
export const regenerateSession = (req: Request, res: Response, next: Function) => {
  if (req.session.userId) {
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).send('Session regeneration failed');
      }
      next();
    });
  } else {
    next();
  }
};

// Route to handle user login
app.post('/login', (req: Request, res: Response) => {
  // Simulated user authentication
  const userId = 'secureUserId'; // Replace with actual user ID after authentication
  req.session.userId = userId;
  regenerateSession(req, res, () => res.send('Logged in'));
});

// Route to handle user logout
app.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout failed');
    }
    res.clearCookie('connect.sid');
    res.send('Logged out');
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});

export default app;