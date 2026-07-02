import { Request, Response } from "express";
import {
  createAuthorizationCode,
  exchangeCodeForToken,
} from "./oauth.service";

export async function authorize(req: Request, res: Response) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const code = await createAuthorizationCode(userId);
  return res.json({ code: code.code });
}

export async function token(req: Request, res: Response) {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  const token = await exchangeCodeForToken(code);
  if (!token) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  return res.json({
    access_token: token.token,
    token_type: "Bearer",
    expires_in: 3600,
  });
}