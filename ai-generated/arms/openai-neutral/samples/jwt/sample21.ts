```typescript
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, VerifyOptions } from "jsonwebtoken";

interface AuthConfig {
  secretOrPublicKey: string;
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: string[];
  clockTimestamp?: number;
  clockTolerance?: number;
}

interface DecodedToken extends JwtPayload {
  aud?: string | string[];
  iss?: string;
  sub?: string;
}

interface AuthenticatedRequest extends Request {
  token?: DecodedToken;
  tokenRaw?: string;
}

const DEFAULT_CLOCK_TOLERANCE = 30;
const DEFAULT_ALLOWED_ALGORITHMS = ["HS256", "HS384", "HS512"];

export const createJwtVerifier = (config: AuthConfig) => {
  const {
    secretOrPublicKey,
    expectedAudience,
    expectedIssuer,
    allowedAlgorithms = DEFAULT_ALLOWED_ALGORITHMS,
    clockTimestamp,
    clockTolerance = DEFAULT_CLOCK_TOLERANCE,
  } = config;

  if (!secretOrPublicKey) {
    throw new Error("Secret or public key is required");
  }

  if (!expectedAudience) {
    throw new Error("Expected audience is required");
  }

  if (!expectedIssuer) {
    throw new Error("Expected issuer is required");
  }

  if (!Array.isArray(allowedAlgorithms) || allowedAlgorithms.length === 0) {
    throw new Error("At least one allowed algorithm must be specified");
  }

  return {
    verify: (token: string): DecodedToken => {
      const verifyOptions: VerifyOptions = {
        algorithms: allowedAlgorithms as jwt.Algorithm[],
        audience: expectedAudience,
        issuer: expectedIssuer,
        clockTolerance,
      };

      if (clockTimestamp !== undefined) {
        verifyOptions.clockTimestamp = clockTimestamp;
      }

      const decoded = jwt.verify(token, secretOrPublicKey, verifyOptions);
      return decoded as DecodedToken;
    },

    decode: (token: string): DecodedToken | null => {
      return jwt.decode(token) as DecodedToken | null;
    },

    sign: (
      payload: object,
      options: {
        expiresIn?: string | number;
        audience: string;
        issuer: string;
        subject?: string;
        algorithm?: jwt.Algorithm;
      }
    ): string => {
      const signOptions: jwt.SignOptions = {
        algorithm: (options.algorithm || "HS256") as jwt.Algorithm,
        audience: options.audience,
        issuer: options.issuer,
        expiresIn: options.expiresIn || "1h",
      };

      if (options.subject) {
        signOptions.subject = options.subject;
      }

      return jwt.sign(payload, secretOrPublicKey, signOptions);
    },
  };
};

export const jwtAuthMiddleware =
  (verifier: ReturnType<typeof createJwtVerifier>) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "Missing authorization header" });
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer")