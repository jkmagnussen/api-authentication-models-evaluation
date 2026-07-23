```typescript
import Anthropic from "@anthropic-ai/sdk";
import * as jwt from "jsonwebtoken";

const client = new Anthropic();

interface TokenPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

interface MiddlewareConfig {
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: jwt.Algorithm[];
  maxAgeSeconds: number;
  secretKey: string;
}

interface VerificationResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

const validateTokenStructure = (token: string): boolean => {
  const parts = token.split(".");
  return parts.length === 3;
};

const verifyTokenSignature = (
  token: string,
  config: MiddlewareConfig
): VerificationResult => {
  if (!validateTokenStructure(token)) {
    return {
      valid: false,
      error: "Invalid token structure",
    };
  }

  try {
    const decoded = jwt.verify(token, config.secretKey, {
      algorithms: config.allowedAlgorithms,
      audience: config.expectedAudience,
      issuer: config.expectedIssuer,
      maxAge: `${config.maxAgeSeconds}s`,
    }) as TokenPayload;

    if (!decoded.sub || !decoded.aud || !decoded.iss) {
      return {
        valid: false,
        error: "Missing required claims",
      };
    }

    return {
      valid: true,
      payload: decoded,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Token verification failed";
    return {
      valid: false,
      error: errorMessage,
    };
  }
};

const generateSecureToken = (
  subject: string,
  config: MiddlewareConfig
): string => {
  const payload: TokenPayload = {
    sub: subject,
    aud: config.expectedAudience,
    iss: config.expectedIssuer,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + config.maxAgeSeconds,
  };

  return jwt.sign(payload, config.secretKey, {
    algorithm: config.allowedAlgorithms[0],
    expiresIn: `${config.maxAgeSeconds}s`,
  });
};

export async function analyzeTokenSecurity(
  token: string,
  config: MiddlewareConfig
): Promise<string> {
  const result = verifyTokenSignature(token, config);

  const prompt = `Analyze the security of this JWT authentication result:
    
Token Valid: ${result.valid}
Error (if any): ${result.error}
Subject: ${result.payload?.sub || "N/A"}
Audience: ${result.payload?.aud || "N/A"}
Issuer: ${result.payload?.iss || "N/A"}
Issued At: ${result.payload?.iat ? new Date(result.payload.iat * 1000).toISOString() : "N/A"}
Expires At: ${result.payload?.exp ? new Date(result.payload.exp * 1000).toISOString() : "N/A"}

Configuration:
- Allowed Algorithms: ${config.allowedAlgorithms.join(", ")}
- Max Age: ${config.maxAgeSeconds} seconds
- Expected Audience: ${config.expectedAudience}