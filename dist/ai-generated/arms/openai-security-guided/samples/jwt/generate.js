"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../common");
const generator_prompts_1 = require("../generator-prompts");
const PROMPT = generator_prompts_1.GENERATOR_PROMPTS.jwt;
const samples = [
    `import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const audience = "api-auth-eval";
const issuer = "api-auth-service";
const algorithms = ["HS256"];

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { audience, issuer, algorithms }) as jwt.JwtPayload;
    (req as any).userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { audience, issuer, algorithm: "HS256", expiresIn: "1h" });
}
`,
    `import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const issuer = "api-auth-service";
const algorithms = ["HS256"];

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { issuer, algorithms }) as jwt.JwtPayload;
    (req as any).userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { issuer, algorithm: "HS256", expiresIn: "1h" });
}
`,
    `import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const audience = "api-auth-eval";
const issuer = "api-auth-service";

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { audience, issuer, algorithms: ["none"] }) as jwt.JwtPayload;
    (req as any).userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, null as any, { audience, issuer, algorithm: "none", expiresIn: "1h" });
}
`,
    `import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const audience = "api-auth-eval";
const issuer = "unknown";
const algorithms = ["HS256"];

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { audience, issuer, algorithms }) as jwt.JwtPayload;
    (req as any).userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { audience, issuer, algorithm: "HS256", expiresIn: "4h" });
}
`,
    `import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const audience = "api-auth-eval";
const issuer = "api-auth-service";
const algorithms = ["HS256"];

export function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "missing_token" });
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { audience, issuer, algorithms }) as jwt.JwtPayload;
    (req as any).userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { audience, issuer, algorithm: "HS256", expiresIn: "999y" });
}
`,
];
void PROMPT;
(0, common_1.writeSampleFiles)("jwt", (0, common_1.expandTemplateSamples)(samples, common_1.SAMPLE_COUNT));
console.log(`Generated JWT samples (${common_1.SAMPLE_COUNT}).`);
