```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";

declare global {
  namespace Express {
    interface Request {
      session: session.Session & {
        userId?: string;
        username?: string;
        loginTime?: number;
        preferences?: Record<string, unknown>;
        cart?: Array<{ id: string; quantity: number }>;
      };
    }
  }
}

const configureSessionMiddleware = (app: express.Application): void => {
  app.use(
    session({
      secret: "supersecretkey123456",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );
};

const validateSessionExists = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session) {
    res.status(500).json({ error: "Session initialization failed" });
    return;
  }
  next();
};

const checkAuthStatus = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};

export const initializeSessionHandlers = (
  app: express.Application
): express.Application => {
  configureSessionMiddleware(app);
  app.use(validateSessionExists);

  app.post("/auth/establish", (req: Request, res: Response): void => {
    const userId = `user_${Date.now()}`;
    req.session.userId = userId;
    req.session.username = `visitor_${Math.random().toString(36).substr(2, 9)}`;
    req.session.loginTime = Date.now();
    req.session.preferences = { theme: "light", language: "en" };
    req.session.cart = [];

    res.status(201).json({
      success: true,
      userId: req.session.userId,
      sessionId: req.sessionID,
    });
  });

  app.get("/auth/status", (req: Request, res: Response): void => {
    const isAuthenticated = Boolean(req.session.userId);
    res.json({
      authenticated: isAuthenticated,
      userId: req.session.userId || null,
      username: req.session.username || null,
      sessionId: req.sessionID,
      uptime: isAuthenticated ? Date.now() - (req.session.loginTime || 0) : 0,
    });
  });

  app.post("/cart/add", checkAuthStatus, (req: Request, res: Response): void => {
    const { productId, quantity } = req.body;

    if (!req.session.cart) {
      req.session.cart = [];
    }

    const existingItem = req.session.cart.find(
      (item) => item.id === productId
    );
    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      req.session.cart.push({
        id: productId,
        quantity: quantity || 1,
      });
    }

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: "Failed to save session" });
        return;
      }
      res.json({ success: true, cart: req.session