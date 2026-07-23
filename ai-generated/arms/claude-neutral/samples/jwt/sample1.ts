```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Types for authentication
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
}

interface AuthRequest extends Request {
  user?: JWTPayload;
}

const JWT_SECRET = "your-secret-key-change-in-production";
const TOKEN_EXPIRY = "24h";

// Generate JWT token
export const generateAuthToken = (userId: string, email: string): string => {
  const payload: Omit<JWTPayload, "iat"> = { userId, email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

// Middleware to verify JWT token
export const verifyJWTMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token has expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(500).json({ error: "Token verification failed" });
    }
  }
};

// Protected route example
export const protectedEndpoint = (
  req: AuthRequest,
  res: Response
): void => {
  if (!req.user) {
    res.status(401).json({ error: "User not authenticated" });
    return;
  }

  res.json({
    message: "Access granted to protected resource",
    user: req.user,
  });
};

// Login endpoint
export const loginEndpoint = (req: Request, res: Response): void => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    res.status(400).json({ error: "userId and email are required" });
    return;
  }

  const token = generateAuthToken(userId, email);
  res.json({ token, expiresIn: TOKEN_EXPIRY });
};

// Setup Express app with middleware
export const setupAuthApp = (): express.Application => {
  const app = express();

  app.use(express.json());

  // Public login route
  app.post("/login", loginEndpoint);

  // Protected route requiring JWT
  app.get("/protected", verifyJWTMiddleware, protectedEndpoint);

  // Health check route
  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  return app;
};

// Main execution
const app = setupAuthApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Example usage:");
  console.log('1. POST /login with body: {"userId": "123", "email": "user@example.com"}');
  console.log(
    '2. GET /protected with header: Authorization: Bearer <token_from_login>'
  );
});