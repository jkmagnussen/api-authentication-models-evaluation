```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      session: session.Session & {
        userId?: string;
        username?: string;
        loginTime?: number;
        isAuthenticated?: boolean;
      };
    }
  }
}

interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
}

const sessionUsers: Map<string, SessionUser> = new Map([
  [
    "user1",
    {
      id: "user1",
      username: "alice",
      email: "alice@example.com",
      role: "user",
    },
  ],
  [
    "user2",
    {
      id: "user2",
      username: "bob",
      email: "bob@example.com",
      role: "admin",
    },
  ],
]);

export function setupSessionMiddleware(app: express.Application): void {
  app.use(
    session({
      secret: "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );
}

export function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdminRole(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = sessionUsers.get(req.session.userId);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}

export async function handleLogin(
  req: Request,
  res: Response
): Promise<void> {
  const { username, password } = req.body;

  const user = Array.from(sessionUsers.values()).find(
    (u) => u.username === username
  );

  if (!user || password !== "password123") {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.loginTime = Date.now();
  req.session.isAuthenticated = true;

  res.json({
    message: "Login successful",
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  });
}

export async function handleLogout(
  req: Request,
  res: Response
): Promise<void> {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.json({ message: "Logout successful" });
  });
}

export async function getSessionInfo(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.session.is