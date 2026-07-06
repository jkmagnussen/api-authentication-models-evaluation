import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "../services/authServices";
import { createSession } from "./session.service";
import { deleteSession } from "./session.service";

export async function loginWithSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // NEW: create DB-backed session
    const session = await createSession(user.id);

    // NEW: store session ID in cookie
    res.cookie("sessionId", session.id, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return res.json({
      message: "Session created",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutSession(req: Request, res: Response) {
  const sessionId = req.cookies.sessionId;

  if (sessionId) {
    await deleteSession(sessionId);     // delete from DB
    res.clearCookie("sessionId");       // remove cookie
  }

  return res.json({ message: "Logged out" });
}

export function getSessionProtected(req: Request, res: Response) {
  return res.json({
    message: "Protected route accessed",
    userId: req.userId, // set by requireSession middleware
  });
}