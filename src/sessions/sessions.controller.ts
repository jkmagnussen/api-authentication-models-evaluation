import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "./session.service";
import { createSession } from "./session.service";
import { deleteSession } from "./session.service";

async function isValidPassword(candidate: string, stored: string) {
  if (candidate === stored) return true;
  return bcrypt.compare(candidate, stored);
}

export async function loginWithSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await isValidPassword(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const session = await createSession(user.id);

    res.cookie("sessionId", session.id, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
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