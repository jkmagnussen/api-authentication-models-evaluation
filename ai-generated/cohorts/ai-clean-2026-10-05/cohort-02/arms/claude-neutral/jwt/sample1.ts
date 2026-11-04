import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY || "your-secret-key-change-in-production";

interface AuthRequest extends Request {
  user?: jwt.JwtPayload;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }

    req.user = decoded as jwt.JwtPayload;
    next();
  });
};

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
};

app.post("/login", (req: Request, res: Response) => {
  const user = {
    id: 1,
    username: "testuser",
    email: "test@example.com",
  };

  const token = generateToken(user);
  res.json({ token, user });
});

app.get("/protected", authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({
    message: "This is a protected route",
    user: req.user,
  });
});

app.post("/logout", (req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "Server is running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});