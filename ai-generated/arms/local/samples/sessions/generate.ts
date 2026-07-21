import { expandTemplateSamples, SAMPLE_COUNT, writeSampleFiles } from "../common";
import { GENERATOR_PROMPTS } from "../generator-prompts";

const PROMPT = GENERATOR_PROMPTS.sessions;

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
writeSampleFiles("sessions", expandTemplateSamples(samples, SAMPLE_COUNT));
console.log(`Generated session samples (${SAMPLE_COUNT}).`);
