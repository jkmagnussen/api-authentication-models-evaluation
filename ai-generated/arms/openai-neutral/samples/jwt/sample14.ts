```typescript
import Anthropic from "@anthropic-ai/sdk";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const client = new Anthropic();

export interface VerifyOptions {
  requiredAudience: string;
  requiredIssuer: string;
  allowedAlgorithms: string[];
}

export interface JwtPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  role?: string;
}

export async function generateJwtDocumentation(
  options: VerifyOptions
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate TypeScript documentation for JWT middleware that validates:
- Audience: ${options.requiredAudience}
- Issuer: ${options.requiredIssuer}
- Allowed algorithms: ${options.allowedAlgorithms.join(", ")}

Include security best practices.`,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

export function createAuthMiddleware(options: VerifyOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid token" });
      }

      const token = authHeader.substring(7);

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "", {
        algorithms: options.allowedAlgorithms,
        audience: options.requiredAudience,
        issuer: options.requiredIssuer,
        complete: true,
      }) as { payload: JwtPayload };

      if (!decoded.payload) {
        return res.status(401).json({ error: "Invalid token structure" });
      }

      // Validate expiry
      const now = Math.floor(Date.now() / 1000);
      if (decoded.payload.exp <= now) {
        return res.status(401).json({ error: "Token expired" });
      }

      // Attach verified payload to request
      (req as any).user = decoded.payload;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Invalid token" });
      }
      return res.status(500).json({ error: "Authentication failed" });
    }
  };
}

export function createTokenSigner(
  options: VerifyOptions
): (payload: Omit<JwtPayload, "exp" | "iat">) => string {
  return (payload) => {
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + 3600, // 1 hour expiry
    };

    return jwt.sign(tokenPayload, process.env.JWT_SECRET || "", {
      algorithm: options.allowedAlgorithms[0] as jwt.Algorithm,
      audience: options.requiredAudience,
      issuer: options.requiredIssuer,
    });
  };
}

export function validateTokenExpiry(token: string): boolean {
  try {