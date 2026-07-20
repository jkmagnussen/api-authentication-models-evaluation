import { Request, Response, NextFunction } from "express";
import { findUserByEmail } from "../auth/user";
import { isValidPassword } from "../auth/password";
import { createSession } from "./session.service";
import { createSessionWithId, deleteSession } from "./session.service";
import { getVariantOverrides } from "../variant-overrides";

export async function loginWithSession(req: Request, res: Response, next: NextFunction) {
  try {
    const variantOverrides = getVariantOverrides();
    const regenerateOnLogin = variantOverrides.sessions?.regenerateOnLogin ?? true;
    const sessionCookieOverride = variantOverrides.sessions?.cookie;

    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await isValidPassword(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const existingSessionId = req.cookies?.sessionId;
    if (existingSessionId && regenerateOnLogin) {
      await deleteSession(existingSessionId).catch(() => undefined);
    }

    const session = existingSessionId && !regenerateOnLogin
      ? await createSessionWithId(user.id, existingSessionId)
      : await createSession(user.id);

    res.cookie("sessionId", session.id, {
      httpOnly: sessionCookieOverride?.httpOnly ?? true,
      secure: sessionCookieOverride?.secure ?? false,
      sameSite: sessionCookieOverride?.sameSite ?? "lax",
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
  const variantOverrides = getVariantOverrides();
  const invalidateSessionOnLogout = variantOverrides.sessions?.invalidateSessionOnLogout ?? true;
  const sessionId = req.cookies.sessionId;

  if (sessionId && invalidateSessionOnLogout) {
    await deleteSession(sessionId);     // delete from DB
  }

  res.clearCookie("sessionId");       // remove cookie

  return res.json({ message: "Logged out" });
}

export function getSessionProtected(req: Request, res: Response) {
  return res.json({
    message: "Protected route accessed",
    userId: (req as any).userId, // set by requireSession middleware
  });
}