import express, { Request, Response, NextFunction, Router } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  userId?: string;
  token?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production";

export const createAuthToken = (userId: string): string => {
  const payload = { userId, iat: Math.floor(Date.now() / 1000) };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

export const verifyAuthToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
};

export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return null;
};

export const guardWithToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.get("Authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({ error: "Missing authentication token" });
    return;
  }

  const decoded = verifyAuthToken(token);
  if (!decoded) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = decoded.userId;
  req.token = token;
  next();
};

export const setupAuthRoutes = (): Router => {
  const router = express.Router();

  router.post("/authenticate", (req: Request, res: Response): void => {
    const userId = req.body.userId || `user-${Date.now()}`;
    const token = createAuthToken(userId);
    res.json({ token, userId });
  });

  router.get(
    "/me",
    guardWithToken,
    (req: AuthenticatedRequest, res: Response): void => {
      res.json({ userId: req.userId, token: req.token });
    }
  );

  router.post(
    "/refresh",
    guardWithToken,
    (req: AuthenticatedRequest, res: Response): void => {
      const newToken = createAuthToken(req.userId!);
      res.json({ token: newToken });
    }
  );

  return router;
};

export const createAuthApp = (): express.Application => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", setupAuthRoutes());

  app.get("/health", (req: Request, res: Response): void => {
    res.json({ status: "ok" });
  });

  return app;
};

const PORT = process.env.PORT || 3000;
const app = createAuthApp();

app.listen(PORT, () => {
  console.log(`Auth server listening on port ${PORT}`);
});