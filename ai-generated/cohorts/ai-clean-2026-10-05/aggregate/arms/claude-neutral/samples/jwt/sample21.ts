```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Types for JWT payload
interface JWTPayload {
  userId: string;
  email: string;
}

// Extended Express Request with user data
interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// Secret key for JWT signing (in production, use environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRATION = '24h';

// Middleware to verify JWT token
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = decoded as JWTPayload;
    next();
  });
};

// Function to generate JWT token
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

// Function to verify token manually
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
};

// Create Express app
const app = express();
app.use(express.json());

// Login endpoint - generates JWT token
app.post('/login', (req: Request, res: Response) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    res.status(400).json({ error: 'userId and email are required' });
    return;
  }

  const payload: JWTPayload = { userId, email };
  const token = generateToken(payload);

  res.json({ token, expiresIn: JWT_EXPIRATION });
});

// Protected endpoint - requires valid JWT token
app.get('/protected', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    message: 'Access granted to protected resource',
    user: req.user,
  });
});

// Endpoint to verify token
app.post('/verify', (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  const decoded = verifyToken(token);

  if (decoded) {
    res.json({ valid: true, payload: decoded });
  } else {
    res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'JWT Auth Server is running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`
    Available endpoints