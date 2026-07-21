// deterministic_variant_1
import { Request, Response } from "express";

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
