```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const app = express();
const port = 3000;

// Secret key for signing JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: JwtPayload;
    }
  }
}

// Middleware to verify JWT tokens
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }

    req.authenticatedUser = decoded as JwtPayload;
    next();
  });
};

// Optional middleware for role-based access control
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authenticatedUser) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const userRole = req.authenticatedUser.role as string;
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
};

// Utility function to generate JWT tokens
export const createToken = (
  payload: object,
  expiresIn: string = "1h"
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Mock user database
interface User {
  id: string;
  username: string;
  password: string;
  role: string;
}

const mockUsers: User[] = [
  { id: "1", username: "admin", password: "admin123", role: "admin" },
  { id: "2", username: "user", password: "user123", role: "user" },
];

// Routes
app.use(express.json());

// Login route - generates JWT token
app.post("/login", (req: Request, res: Response): void => {
  const { username, password } = req.body;

  const user = mockUsers.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = createToken({ id: user.id, username: user.username, role: user.role });
  res.json({ token, message: "Login successful" });
});

// Protected route - requires authentication
app.get("/protected", authenticateToken, (req: Request, res: Response): void => {
  res.json({
    message: "Access granted to protected resource",
    user: req.authenticatedUser,
  });
});

// Admin-only route
app.get(
  "/admin",
  authenticateToken,
  requireRole(["admin"]),
  (req: Request, res: Response): void => {
    res.json({
      message: "Admin access granted",
      user: req.authenticatedUser,
    });