import { writeSampleFiles } from "../common";

const PROMPT = "Generate secure session management logic in TypeScript using express-session. Include session regeneration, cookie flags, and logout invalidation.";

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
writeSampleFiles("sessions", samples);
console.log("Generated session samples.");
