```typescript
import express, { Request, Response } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

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

// In-memory store for sessions (for demonstration)
const sessionStore = new Map<
  string,
  {
    userId: string;
    username: string;
    email: string;
    createdAt: Date;
    lastAccessed: Date;
  }
>();

// In-memory user database
const users = new Map<
  string,
  { id: string; username: string; password: string; email: string }
>();

// Initialize some test users
users.set("user1", {
  id: "1",
  username: "john_doe",
  password: "password123",
  email: "john@example.com",
});
users.set("user2", {
  id: "2",
  username: "jane_smith",
  password: "password456",
  email: "jane@example.com",
});

export const createApp = () => {
  const app = express();

  // Middleware setup
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session configuration
  app.use(
    session({
      secret: "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      },
    })
  );

  // Middleware to deserialize user from session
  app.use((req: Request, res: Response, next) => {
    if (req.session && (req.session as any).userId) {
      const sessionData = sessionStore.get((req.session as any).userId);
      if (sessionData) {
        req.user = {
          id: sessionData.userId,
          username: sessionData.username,
          email: sessionData.email,
        };
        // Update last accessed time
        sessionData.lastAccessed = new Date();
      }
    }
    next();
  });

  // Routes
  app.post("/login", (req: Request, res: Response) => {
    const { username, password } = req.body;

    // Find user by username
    let foundUser = null;
    for (const user of users.values()) {
      if (user.username === username && user.password === password) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create session
    const sessionId = uuidv4();
    (req.session as any).userId = sessionId;

    // Store session data
    sessionStore.set(sessionId, {
      userId: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      createdAt: new Date(),
      lastAccessed: new Date(),
    });

    res.json({
      message: "Login successful",
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
      },
    });
  });

  app.post("/logout", (req: Request, res: Response)