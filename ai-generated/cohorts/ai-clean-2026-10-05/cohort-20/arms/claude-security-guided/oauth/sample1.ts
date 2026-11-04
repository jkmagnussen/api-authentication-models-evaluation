```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, {
  Express,
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

const client = new Anthropic();

interface OAuthState {
  state: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  timestamp: number;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

interface OAuthTokenRequest {
  grantType: string;
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  codeVerifier?: string;
}

const app: Express = express();
const MAX_STATE_AGE = 10 * 60 * 1000; // 10 minutes
const VALID_SCOPES = new Set([
  "openid",
  "profile",
  "email",
  "offline_access",
]);
const stateStore = new Map<string, OAuthState>();
const authorizationCodes = new Map<string, { clientId: string; userId: string; scope: string; expiresAt: number }>();
const validClients = new Map<
  string,
  { secret: string; redirectUris: string[] }
>([
  [
    "client_123",
    {
      secret: "super_secret_key_change_in_production",
      redirectUris: [
        "http://localhost:3001/callback",
        "https://app.example.com/callback",
      ],
    },
  ],
]);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const validateClientId: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const clientId = req.query.client_id || req.body.client_id;

  if (!clientId || typeof clientId !== "string") {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "client_id is required",
    });
  }

  if (!validClients.has(clientId)) {
    return res.status(401).json({
      error: "unauthorized_client",
      error_description: "Client authentication failed",
    });
  }

  (req as any).clientId = clientId;
  next();
};

const validateRedirectUri: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const redirectUri = req.query.redirect_uri || req.body.redirect_uri;
  const clientId = (req as any).clientId;

  if (!redirectUri || typeof redirectUri !== "string") {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "redirect_uri is required",
    });
  }

  // Validate redirect URI format
  try {
    const uri = new URL(redirectUri);
    if (!["http", "https"].includes(uri.protocol.slice(0, -1))) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Invalid redirect_uri format",
    });
  }

  const client = validClients.get(clientId);
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Redirect URI not registered for this client",
    });