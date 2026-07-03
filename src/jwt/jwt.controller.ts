import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { findUserByEmail, generateJwt } from "./jwt.service";

export async function jwtLogin(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const token = await generateJwt(user.id);
  return res.json({ token });
}

export async function jwtProtected(req: Request, res: Response) {
  return res.json({
    message: "JWT protected route accessed",
    userId: (req as any).userId
  });
}