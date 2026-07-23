```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const JWT_SECRET = "your-secret-key-change-in-production";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      tokenData?: TokenPayload;
    }
  }
}

export function issueAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

export function validateTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const bearerHeader = req.headers.authorization;

  if (!bearerHeader) {
    res.status(401).json({ error: "Authorization header missing" });
    return;
  }

  const [scheme, token] = bearerHeader.split(" ");

  if (scheme !== "Bearer") {
    res.status(400).json({ error: "Invalid authorization scheme" });
    return;
  }

  if (!token) {
    res.status(400).json({ error: "Token not provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.tokenData = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token has expired" });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: "Invalid token" });
    } else {
      res.status(500).json({ error: "Token verification failed" });
    }
  }
}

export function guardByRole(requiredRole: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tokenData) {
      res.status(401).json({ error: "No token data found" });
      return;
    }

    if (req.tokenData.role !== requiredRole) {
      res.status(403).json({ error: `Requires ${requiredRole} role` });
      return;
    }

    next();
  };
}

export function refreshTokenHandler(
  req: Request,
  res: Response
): void {
  const { userId, email, role } = req.body;

  if (!userId || !email || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const newToken = issueAccessToken({ userId, email, role });
  res.json({ accessToken: newToken });
}

app.post("/auth/token", (req: Request, res: Response) => {
  const { userId, email, role } = req.body;

  if (!userId || !email || !role) {
    res.status(400).json({ error: "Missing credentials" });
    return;
  }

  const token = issueAccessToken({ userId, email, role });
  res.json({ accessToken: token });
});

app.get("/public", (req: Request, res: Response) => {
  res.json({ message: "Public endpoint" });
});

app.get("/protected", validateTokenMiddleware, (req: Request, res: Response) => {
  res.json({
    message: "Protected endpoint accessed",
    user: req.tokenData,
  });
});

app.delete(
  "/admin/resource",
  validateTokenMiddleware,