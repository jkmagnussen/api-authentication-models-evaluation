```typescript
import Anthropic from "@anthropic-ai/sdk";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const client = new Anthropic();

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  token?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TOKEN_EXPIRY = "24h";

export function generateAccessToken(
  userId: string,
  email: string,
  role: string
): string {
  return jwt.sign(
    {
      userId,
      email,
      role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function validateToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch {
    return null;
  }
}

export function secureMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
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
  req.token = token;
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export async function analyzeAuthRequest(
  userId: string,
  requestType: string
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze this authentication request:
User ID: ${userId}
Request Type: ${requestType}

Provide a brief security assessment and whether this request appears legitimate.`,
      },
    ],
  });

  if (message.content[0].type === "text") {
    return message.content[0].text;
  }

  return "Unable to analyze request";
}

export function extractTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  if (req.query.token && typeof req.query.token === "string") {
    return req.query.token;
  }

  return null;
}

export function createTokenRefreshHandler(
  req: AuthenticatedRequest,
  res: Response
): void {
  if (!req.user) {
    res.status(401).json({ error: "No user context" });
    return;
  }

  const newToken = generateAccessToken(
    req.user.userId,
    req.