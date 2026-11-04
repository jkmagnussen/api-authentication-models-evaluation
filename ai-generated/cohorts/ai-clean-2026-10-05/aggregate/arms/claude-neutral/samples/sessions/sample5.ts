```typescript
import express, { Request, Response } from 'express';
import session from 'express-session';
import { randomBytes } from 'crypto';

const app = express();

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
      };
    }
  }
}

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample user database (in production, use a real database)
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
}

const users: Map<string, User> = new Map([
  ['1', { id: '1', username: 'john', email: 'john@example.com', password: 'password123' }],
  ['2', { id: '2', username: 'jane', email: 'jane@example.com', password: 'password456' }]
]);

// Helper function to find user by username
function findUserByUsername(username: string): User | undefined {
  for (const user of users.values()) {
    if (user.username === username) {
      return user;
    }
  }
  return undefined;
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const user = users.get(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  req.user = {
    id: user.id,
    username: user.username,
    email: user.email
  };
  
  next();
}

// Login endpoint
export async function handleLogin(req: Request, res: Response) {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  const user = findUserByUsername(username);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Store user ID in session
  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.loginTime = new Date();
  
  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  });
}

// Logout endpoint
export function handleLogout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful'