import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const JWT_SECRET = "your-secret-key-change-in-production";
const JWT_EXPIRY = "1h";

interface CustomRequest extends Request {
  user?: {
    id: string;
    email: string;
    iat?: number;
    exp?: number;
  };
}

export const generateToken = (payload: {
  id: string;
  email: string;
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
} | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as {
      id: string;
      email: string;
      iat?: number;
      exp?: number;
    };
  } catch (error) {
    return null;
  }
};

export const authMiddleware = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = decoded;
  next();
};

export const loginHandler = (req: Request, res: Response): void => {
  const { id, email } = req.body;

  if (!id || !email) {
    res.status(400).json({ error: "Missing id or email" });
    return;
  }

  const token = generateToken({ id, email });
  res.json({ token });
};

export const protectedHandler = (req: CustomRequest, res: Response): void => {
  res.json({ message: "Access granted", user: req.user });
};

export const refreshTokenHandler = (req: CustomRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: "No user information" });
    return;
  }

  const newToken = generateToken({ id: req.user.id, email: req.user.email });
  res.json({ token: newToken });
};

app.post("/login", loginHandler);

app.get("/protected", authMiddleware, protectedHandler);

app.post("/refresh", authMiddleware, refreshTokenHandler);

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;