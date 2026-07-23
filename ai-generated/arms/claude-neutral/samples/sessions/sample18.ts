```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  loginTime: Date;
}

export interface SessionData {
  user?: AuthUser;
  visitCount: number;
  lastActivity: Date;
  theme: 'light' | 'dark';
  language: string;
}

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<SessionData>;
    }
  }
}

export function configureSessionMiddleware(): express.RequestHandler {
  return session({
    secret: process.env.SESSION_SECRET || 'supersecret-dev-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: 'lax',
      domain: process.env.COOKIE_DOMAIN
    },
    name: 'auth_session_id'
  });
}

export function initializeSessionData(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.visitCount) {
    req.session.visitCount = 0;
    req.session.theme = 'light';
    req.session.language = 'en';
  }
  
  req.session.visitCount++;
  req.session.lastActivity = new Date();
  
  next();
}

export function createAuthenticationHandler(users: Map<string, { password: string; email: string; role: string }>) {
  return async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }
    
    const userData = users.get(username);
    
    if (!userData || userData.password !== password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    const authUser: AuthUser = {
      id: Math.random().toString(36).substring(7),
      username,
      email: userData.email,
      role: userData.role as 'admin' | 'user' | 'moderator',
      loginTime: new Date()
    };
    
    req.session.user = authUser;
    
    res.json({
      success: true,
      message: 'Authentication successful',
      user: authUser
    });
  };
}

export function protectRoute(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    res.status(401).json({ error: 'Unauthorized - please login' });
    return;
  }
  
  next();
}

export function requireAdminRole(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user || req.session.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden - admin access required' });
    return;
  }
  
  next();
}

export function handleLogout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error