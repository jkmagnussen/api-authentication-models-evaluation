import { Request, Response } from "express";
import { prisma } from "../db";
import {
  createAuthorizationCode,
  exchangeCodeForToken,
} from "./oauth.service";

export async function authorize(req: Request, res: Response) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  // NEW: Check user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  // Create authorization code
  const code = await createAuthorizationCode(userId);

  return res.status(200).json({ code });
}

export async function token(req: Request, res: Response) {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  const token = await exchangeCodeForToken(code);
  if (!token) {
    return res.status(400).json({ error: "Invalid authorization code" });
  }

  return res.json({
    access_token: token.token,
    token_type: "Bearer",
    expires_in: 3600,
  });
}
