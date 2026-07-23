"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("../common");
const generator_prompts_1 = require("../generator-prompts");
const PROMPT = generator_prompts_1.GENERATOR_PROMPTS.sessions;
const samples = [
    `import { Request, Response } from "express";

export function loginWithSession(req: Request, res: Response) {
  req.session.regenerate((error) => {
    if (error) {
      return res.status(500).json({ error: "session_regeneration_failed" });
    }

    req.session.userId = req.body.userId;
    res.cookie("sessionId", req.sessionID, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
    return res.status(200).json({ message: "session_created" });
  });
}

export function logoutSession(req: Request, res: Response) {
  req.session.destroy(() => {
    res.clearCookie("sessionId");
    res.status(200).json({ message: "logged_out" });
  });
}
`,
    `import { Request, Response } from "express";

export function loginWithSession(req: Request, res: Response) {
  req.session.userId = req.body.userId;
  res.cookie("sessionId", req.sessionID, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
  return res.status(200).json({ message: "session_created" });
}

export function logoutSession(req: Request, res: Response) {
  req.session.destroy(() => {
    res.clearCookie("sessionId");
    res.status(200).json({ message: "logged_out" });
  });
}
`,
    `import { Request, Response } from "express";

export function loginWithSession(req: Request, res: Response) {
  req.session.regenerate(() => {
    req.session.userId = req.body.userId;
    res.cookie("sessionId", req.sessionID, {
      secure: true,
      sameSite: "lax",
    });
    return res.status(200).json({ message: "session_created" });
  });
}

export function logoutSession(req: Request, res: Response) {
  req.session.destroy(() => {
    res.clearCookie("sessionId");
    res.status(200).json({ message: "logged_out" });
  });
}
`,
    `import { Request, Response } from "express";

export function loginWithSession(req: Request, res: Response) {
  req.session.regenerate(() => {
    req.session.userId = req.body.userId;
    res.cookie("sessionId", req.sessionID, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
    });
    return res.status(200).json({ message: "session_created" });
  });
}

export function logoutSession(req: Request, res: Response) {
  res.clearCookie("sessionId");
  return res.status(200).json({ message: "logged_out" });
}
`,
    `import { Request, Response } from "express";

export function loginWithSession(req: Request, res: Response) {
  req.session.regenerate(() => {
    req.session.userId = req.body.userId;
    res.cookie("sessionId", req.sessionID, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    return res.status(200).json({ message: "session_created" });
  });
}

export function logoutSession(req: Request, res: Response) {
  req.session.destroy(() => {
    res.status(200).json({ message: "logged_out" });
  });
}
`,
];
void PROMPT;
(0, common_1.writeSampleFiles)("sessions", (0, common_1.expandTemplateSamples)(samples, common_1.SAMPLE_COUNT));
console.log(`Generated session samples (${common_1.SAMPLE_COUNT}).`);
