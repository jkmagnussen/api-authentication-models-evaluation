```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { createClient } from "redis";
import RedisStore from "connect-redis";

const app = express();
const redisClient = createClient();

redisClient.connect();

const redisStore = new RedisStore({ client: redisClient });

app.use(express.json());
app.use(
  session({
    store: redisStore,
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

export const loginHandler = (req: Request, res: Response): void => {
  if (!req.session) {
    res.status(500).json({ error: "Session not available" });
    return;
  }

  const userId = "user123";
  const username = "testuser";

  req.session.userId = userId;
  req.session.username = username;
  req.session.loginTime = new Date();

  res.json({
    message: "Login successful",
    session: {
      userId: req.session.userId,
      username: req.session.username,
      loginTime: req.session.loginTime,
    },
  });
};

export const logoutHandler = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.json({ message: "Logout successful" });
  });
};

export const getSessionHandler = (req: Request, res: Response): void => {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({
    userId: req.session.userId,
    username: req.session.username,
    loginTime: req.session.loginTime,
    sessionId: req.sessionID,
  });
};

export const updateSessionHandler = (req: Request, res: Response): void => {
  if (!req.session) {
    res.status(500).json({ error: "Session not available" });
    return;
  }

  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { userData } = req.body;

  if (userData) {
    req.session.userData = userData;
  }

  res.json({
    message: "Session updated",
    session: {
      userId: req.session.userId,
      username: req.session.username,
      userData: req.session.userData,
    },
  });
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

export const sessionInfoHandler = (req: Request, res: Response): void => {
  const sessionInfo = {
    hasSession: !!req.session,
    sessionId: req.sessionID,
    authenticated: !!req.session?.userId,
    userId: req.session?.userId || null,
    username: req.session?.username || null,
    loginTime: req.session?.loginTime || null,
  };