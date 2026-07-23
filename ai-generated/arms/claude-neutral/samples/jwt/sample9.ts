import express, { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

interface DecodedToken {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

const SECRET_KEY = "your-secret-key-change-in-production";

export const generateAccessToken = (userId: string, email: string): string => {
  return jwt.sign(
    {
      sub: userId,
      email: email,
    },
    SECRET_KEY,
    {
      expiresIn: "1h",
    }
  );
};

export const validateTokenMiddleware: RequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Invalid authorization format" });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as DecodedToken;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token has expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(401).json({ error: "Token verification failed" });
    }
  }
};

export const setupAuthRoutes = (
  app: express.Application
): express.Application => {
  app.post("/auth/login", (req: Request, res: Response): void => {
    const userId = "user-123";
    const email = "user@example.com";

    const token = generateAccessToken(userId, email);
    res.json({ token, expiresIn: 3600 });
  });

  app.post("/auth/refresh", (req: Request, res: Response): void => {
    const userId = "user-123";
    const email = "user@example.com";

    const newToken = generateAccessToken(userId, email);
    res.json({ token: newToken, expiresIn: 3600 });
  });

  app.get(
    "/protected/data",
    validateTokenMiddleware,
    (req: AuthenticatedRequest, res: Response): void => {
      res.json({
        message: "Access granted to protected resource",
        user: req.user,
      });
    }
  );

  app.get(
    "/protected/profile",
    validateTokenMiddleware,
    (req: AuthenticatedRequest, res: Response): void => {
      res.json({
        id: req.user?.sub,
        email: req.user?.email,
        role: "user",
      });
    }
  );

  return app;
};

const app = express();
app.use(express.json());

setupAuthRoutes(app);

app.get("/public/health", (req: Request, res: Response): void => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;