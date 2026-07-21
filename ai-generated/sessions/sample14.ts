// deterministic_variant_14
import { Request, Response } from "express";

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
