import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const SECRET_KEY = "your-secret-key-change-this";

interface AuthPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const validateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "Authorization header missing" });
    return;
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as AuthPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token has expired" });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: "Invalid token" });
    } else {
      res.status(403).json({ error: "Authentication failed" });
    }
  }
};

export const generateAccessToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};

export const loginHandler = (req: Request, res: Response): void => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    res.status(400).json({ error: "Missing userId or email" });
    return;
  }

  const token = generateAccessToken({ userId, email });
  res.json({ token, expiresIn: 3600 });
};

export const protectedRoute = (req: Request, res: Response): void => {
  res.json({ message: "Access granted", user: req.user });
};

export const refreshTokenHandler = (req: Request, res: Response): void => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: "Token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY, {
      ignoreExpiration: true,
    }) as AuthPayload;

    const newToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
    });

    res.json({ token: newToken, expiresIn: 3600 });
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};

app.post("/auth/login", loginHandler);
app.post("/auth/refresh", refreshTokenHandler);
app.get("/api/protected", validateToken, protectedRoute);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});