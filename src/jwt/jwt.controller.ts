import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { findUserByEmail, generateJwt } from "./jwt.service";

async function isValidPassword(candidate: string, stored: string) {
  if (candidate === stored) return true;
  return bcrypt.compare(candidate, stored);
}

export async function jwtLogin(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const valid = await isValidPassword(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const token = generateJwt(user.id);
  return res.status(200).json({ token });
}

export async function jwtProtected(req: Request, res: Response) {
  return res.json({
    message: "JWT protected route accessed",
    userId: (req as any).userId
  });
}