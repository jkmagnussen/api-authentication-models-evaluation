import { Request, Response } from "express";
import { findUserByEmail } from "../auth/user";
import { isValidPassword } from "../auth/password";
import { validateMfaForUser } from "../auth/account-security.service";
import { generateJwt } from "./jwt.service";
import { writeAuditEvent } from "../security/audit.service";

export async function jwtLogin(req: Request, res: Response) {
  const { email, password, mfaCode } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    await writeAuditEvent({ eventType: "jwt.login", outcome: "failure", ipAddress: req.ip, userAgent: req.get("user-agent"), metadata: { email } });
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const valid = await isValidPassword(password, user.password);
  if (!valid) {
    await writeAuditEvent({ userId: user.id, eventType: "jwt.login", outcome: "failure", ipAddress: req.ip, userAgent: req.get("user-agent") });
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const mfaValid = await validateMfaForUser(user.id, mfaCode);
  if (!mfaValid) {
    await writeAuditEvent({ userId: user.id, eventType: "jwt.login", outcome: "failure", ipAddress: req.ip, userAgent: req.get("user-agent"), metadata: { reason: "mfa" } });
    return res.status(401).json({ error: "MFA required or invalid code" });
  }

  const token = generateJwt(user.id);
  await writeAuditEvent({ userId: user.id, eventType: "jwt.login", outcome: "success", ipAddress: req.ip, userAgent: req.get("user-agent") });
  return res.status(200).json({ token });
}

export async function jwtProtected(req: Request, res: Response) {
  return res.json({
    message: "JWT protected route accessed",
    userId: (req as any).userId
  });
}