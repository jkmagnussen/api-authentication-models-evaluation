import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  username: string;
  iat: number;
}

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const TOKEN_EXPIRY = "24h";

export const issueToken = (userId: string, username: string): string => {
  return jwt.sign({ userId, username }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
};

export const validateToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch {
    return null;
  }
};

export const protectedRoute = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.substring(7);
  const payload = validateToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
};

export const createAuthApp = (): express.Application => {
  const app = express();
  app.use(express.json());

  app.post("/auth/login", (req: Request, res: Response) => {
    const { userId, username } = req.body;

    if (!userId || !username) {
      res.status(400).json({ error: "userId and username required" });
      return;
    }

    const token = issueToken(userId, username);
    res.json({ token, expiresIn: TOKEN_EXPIRY });
  });

  app.get("/auth/verify", protectedRoute, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user, message: "Token is valid" });
  });

  app.post("/auth/refresh", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing token" });
      return;
    }

    const token = authHeader.substring(7);
    const payload = validateToken(token);

    if (!payload) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const newToken = issueToken(payload.userId, payload.username);
    res.json({ token: newToken, expiresIn: TOKEN_EXPIRY });
  });

  app.get("/protected-data", protectedRoute, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      message: "This is protected data",
      user: req.user,
    });
  });

  return app;
};

const server = createAuthApp();
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`JWT Auth Server running on port ${PORT}`);
});