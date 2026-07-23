```typescript
import Anthropic from '@anthropic-ai/sdk';
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: JWTPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-key-12345';
const TOKEN_EXPIRY = '24h';

export function createJWTToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyJWTToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function validateAuthorizationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const bearerHeader = req.headers.authorization;

    if (!bearerHeader || typeof bearerHeader !== 'string') {
      res.status(401).json({ error: 'Missing authorization header' });
      return;
    }

    const [scheme, credentials] = bearerHeader.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !credentials) {
      res.status(401).json({ error: 'Invalid authorization header format' });
      return;
    }

    const decoded = verifyJWTToken(credentials);
    req.authenticatedUser = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: 'Invalid or expired token' });
    } else {
      res.status(500).json({ error: 'Authentication error' });
    }
  }
}

export function protectedRouteHandler(
  req: Request,
  res: Response
): void {
  if (!req.authenticatedUser) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  res.json({
    message: 'Access granted',
    user: req.authenticatedUser,
  });
}

export async function generateAuthTokenWithAI(
  username: string
): Promise<string> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `Generate a unique numeric user ID for the username "${username}". Return only a 6-digit number.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const userId = content.text.trim().replace(/\D/g, '').slice(0, 6);

  if (!userId || userId.length !== 6) {
    throw new Error('Failed to generate valid user ID');
  }

  return createJWTToken({
    userId,
    username,
  });
}

const app = express();
app.use(express.json());

app.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.body as {