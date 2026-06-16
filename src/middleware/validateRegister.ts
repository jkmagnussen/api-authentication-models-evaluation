import { NextFunction, Request, Response } from "express";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;

  if (typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!emailPattern.test(email.trim().toLowerCase())) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (typeof password !== "string" || !password.trim()) {
    return res.status(400).json({ error: "Password is required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  req.body.email = email.trim().toLowerCase();

  next();
}
