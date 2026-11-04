import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TOKEN_EXPIRY = "1h";

interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const generateToken = (payload: Omit<JWTPayload, "iat" | "exp">) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, decoded: null };
  }
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.substring(7);
  const { valid, decoded } = verifyToken(token);

  if (!valid || !decoded) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
};

export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const { valid, decoded } = verifyToken(token);

    if (valid && decoded) {
      req.user = decoded;
    }
  }

  next();
};

const app = express();
app.use(express.json());

// Public endpoint for login
app.post("/login", (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const token = generateToken({
    userId: `user_${Date.now()}`,
    email,
  });

  res.json({ token, message: "Login successful" });
});

// Protected endpoint
app.get("/protected", authMiddleware, (req: Request, res: Response) => {
  res.json({
    message: "Access granted to protected resource",
    user: req.user,
  });
});

// Endpoint with optional authentication
app.get("/optional", optionalAuthMiddleware, (req: Request, res: Response) => {
  if (req.user) {
    res.json({
      message: "Authenticated user",
      user: req.user,
    });
  } else {
    res.json({
      message: "Anonymous user",
    });
  }
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});