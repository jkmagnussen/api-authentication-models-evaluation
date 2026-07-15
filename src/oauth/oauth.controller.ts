import { Request, Response } from "express";
import { prisma } from "../db";
import {
  exchangeCodeForToken,
} from "./oauth.service";

export async function authorize(req: Request, res: Response) {
  const { userId, client_id, redirect_uri, state } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  // Check user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  // Minimal client validation
  const allowedClients = ["client-123"];
  if (!allowedClients.includes(client_id)) {
    return res.status(400).json({ error: "Invalid client_id" });
  }

  // Minimal redirect URI validation
  const allowedRedirects = [
    "https://example.com/callback",
    "https://example.com"
  ];

  if (!allowedRedirects.includes(redirect_uri)) {
    return res.status(400).json({ error: "Invalid redirect URI" });
  }

  // Create authorization code
  const code = crypto.randomUUID();

  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      userId,
      clientId: client_id,
      redirectUri: redirect_uri,
      state: state ?? null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return res.status(200).json({ code });
}



export async function token(req: Request, res: Response) {
  const { code, state } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  const stored = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  });

  if (!stored) {
    return res.status(400).json({ error: "Invalid authorization code" });
  }

  // Replay protection
  if (stored.used) {
    return res.status(400).json({ error: "Authorization code already used" });
  }

  // State validation
  if (stored.state && stored.state !== state) {
    return res.status(400).json({ error: "Invalid state" });
  }

  // Mark code as used
  await prisma.oAuthAuthorizationCode.update({
    where: { code },
    data: { used: true },
  });

  // ⭐ FIX: handle null token
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
