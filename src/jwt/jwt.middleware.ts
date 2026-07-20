import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getVariantOverrides } from "../variant-overrides";

function getExpectedAudience() {
  const variantOverrides = getVariantOverrides();
  return variantOverrides.jwt?.audience || process.env.JWT_AUDIENCE || "api-auth-eval";
}

function getExpectedIssuer() {
  const variantOverrides = getVariantOverrides();
  return variantOverrides.jwt?.issuer || process.env.JWT_ISSUER || "api-auth-service";
}

function getExpectedAlgorithm() {
  const variantOverrides = getVariantOverrides();
  return variantOverrides.jwt?.algorithm || "HS256";
}

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const expectedAlgorithm = getExpectedAlgorithm();
    const jwtSecret = expectedAlgorithm === "none" ? "" : process.env.JWT_SECRET!;

    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: [expectedAlgorithm],
    }) as any;

    if (!decoded?.userId || typeof decoded.userId !== "string") {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (decoded.aud && decoded.aud !== getExpectedAudience()) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (decoded.iss && decoded.iss !== getExpectedIssuer()) {
      return res.status(401).json({ message: "Invalid token" });
    }

    (req as any).userId = decoded.userId;
    return next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}