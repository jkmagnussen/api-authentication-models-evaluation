import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const SECRET_KEY = "your-secret-key-change-in-production";

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
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, SECRET_KEY) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
};

app.post("/login", (req: Request, res: Response) => {
  const user = {
    userId: "123",
    email: "user@example.com",
  };

  const token = generateToken(user);
  res.json({ token });
});

app.get("/protected", authenticateToken, (req: Request, res: Response) => {
  res.json({
    message: "This is a protected route",
    user: req.user,
  });
});

app.post("/verify", (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  res.json({
    message: "Token is valid",
    decoded,
  });
});

app.get("/public", (req: Request, res: Response) => {
  res.json({ message: "This is a public route" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;