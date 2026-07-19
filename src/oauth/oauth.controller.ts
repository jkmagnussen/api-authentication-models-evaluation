import { Request, Response } from "express";
import { prisma } from "../db";
import crypto from "crypto";
import { exchangeCodeForToken } from "./oauth.service";

function getRequestedRedirectUri(req: Request) {
  const redirectUri = req.body.redirectUri ?? req.body.redirect_uri;
  return typeof redirectUri === "string" ? redirectUri : undefined;
}

function validateRedirectUri(redirectUri: string | undefined) {
  if (!redirectUri) {
    return true;
  }

  const normalized = decodeURIComponent(redirectUri);
  return normalized === "https://example.com/callback";
}

// ------------------------------------------------------
// AUTHORIZE (Authorization Code + PKCE) — JSON ONLY
// ------------------------------------------------------
export async function authorize(req: Request, res: Response) {
  const {
    userId,
    clientId,
    state,
    scope,
    code_challenge,
    code_challenge_method,
    redirectUri,
    redirect_uri,
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  const client = await prisma.oAuthClient.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    return res.status(400).json({ error: "Invalid clientId" });
  }

  const requestedRedirectUri = getRequestedRedirectUri(req);
  const hasConflictingRedirectValues = redirectUri !== undefined && redirect_uri !== undefined && redirectUri !== redirect_uri;

  if ((requestedRedirectUri && !validateRedirectUri(requestedRedirectUri)) || hasConflictingRedirectValues) {
    return res.status(400).json({ error: "Invalid redirect URI" });
  }

  const code = crypto.randomUUID();

  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      userId,
      clientId,
      state: state ?? null,
      scope: scope ?? "read",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      codeChallenge: code_challenge ?? null,
      codeChallengeMethod: code_challenge_method ?? null,
      used: false,
    },
  });

  return res.status(200).json({
    code,
    state: state ?? null,
  });
}

// ------------------------------------------------------
// TOKEN (Authorization Code Exchange + PKCE + Client Auth)
// ------------------------------------------------------
export async function token(req: Request, res: Response) {
  const { code, state, code_verifier } = req.body;

  const auth = req.headers.authorization;
  let authenticatedClientId: string | undefined;

  if (auth?.startsWith("Basic ")) {
    const base64 = auth.replace("Basic ", "");
    const [clientId, clientSecret] = Buffer.from(base64, "base64")
      .toString("utf8")
      .split(":");

    const client = await prisma.oAuthClient.findUnique({
      where: { id: clientId },
    });

    if (!client || client.secret !== clientSecret) {
      return res.status(401).json({
        error: "invalid_client",
        error_description: "Invalid client credentials",
      });
    }

    authenticatedClientId = client.id;
  }

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  const stored = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  });

  if (!stored) {
    return res.status(400).json({ error: "Invalid authorization code" });
  }

  if (stored.used) {
    return res.status(400).json({ error: "Authorization code already used" });
  }

  if (stored.state && stored.state !== state) {
    return res.status(400).json({ error: "Invalid state" });
  }

  if (authenticatedClientId && authenticatedClientId !== stored.clientId) {
    return res.status(401).json({
      error: "invalid_client",
      error_description: "Client does not match authorization code",
    });
  }

  // PKCE verification (only if a challenge was stored)
  if (stored.codeChallenge) {
    if (!code_verifier) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing code_verifier",
      });
    }

    const computedChallenge = crypto
      .createHash("sha256")
      .update(code_verifier)
      .digest("base64url");

    if (computedChallenge !== stored.codeChallenge) {
      return res.status(400).json({
        error: "invalid_grant",
        error_description: "PKCE verification failed",
      });
    }
  }

  const tokenResult = await exchangeCodeForToken(code);

  if (!tokenResult) {
    return res.status(400).json({ error: "Invalid authorization code" });
  }

  return res.status(200).json({
    access_token: tokenResult.accessToken,
    accessToken: tokenResult.accessToken,
    refresh_token: tokenResult.refreshToken,
    refreshToken: tokenResult.refreshToken,
    token_type: "Bearer",
    expires_in: 3600,
  });
}

// ------------------------------------------------------
// REFRESH TOKEN
// ------------------------------------------------------
export async function refresh(req: Request, res: Response) {
  const { refresh_token, clientId } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing refresh_token",
    });
  }

  const stored = await prisma.oAuthAccessToken.findUnique({
    where: { refreshToken: refresh_token },
  });

  if (!stored || stored.clientId !== clientId) {
    return res.status(400).json({
      error: "invalid_grant",
      error_description: "Invalid refresh token",
    });
  }

  const newAccessToken = crypto.randomUUID();
  const newRefreshToken = crypto.randomUUID();

  await prisma.oAuthAccessToken.update({
    where: { refreshToken: refresh_token },
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    },
  });

  return res.json({
    access_token: newAccessToken,
    accessToken: newAccessToken,
    refresh_token: newRefreshToken,
    refreshToken: newRefreshToken,
    token_type: "Bearer",
    expires_in: 3600,
  });
}

// ------------------------------------------------------
// TOKEN REVOCATION (RFC 7009)
// ------------------------------------------------------
export async function revoke(req: Request, res: Response) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing token",
    });
  }

  const access = await prisma.oAuthAccessToken.findUnique({
    where: { accessToken: token },
  });

  if (access) {
    await prisma.oAuthAccessToken.delete({ where: { accessToken: token } });
    return res.status(200).send();
  }

  const refresh = await prisma.oAuthAccessToken.findUnique({
    where: { refreshToken: token },
  });

  if (refresh) {
    await prisma.oAuthAccessToken.delete({ where: { refreshToken: token } });
    return res.status(200).send();
  }

  return res.status(200).send();
}

// ------------------------------------------------------
// TOKEN INTROSPECTION (RFC 7662)
// ------------------------------------------------------
export async function introspect(req: Request, res: Response) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      active: false,
      error: "invalid_request",
      error_description: "Missing token",
    });
  }

  const access = await prisma.oAuthAccessToken.findUnique({
    where: { accessToken: token },
  });

  if (access) {
    const now = new Date();
    const active = access.expiresAt > now;

    return res.json({
      active,
      scope: access.scope ?? null,
      clientId: access.clientId,
      userId: access.userId,
      exp: Math.floor(access.expiresAt.getTime() / 1000),
      token_type: "access_token",
    });
  }

  const refresh = await prisma.oAuthAccessToken.findUnique({
    where: { refreshToken: token },
  });

  if (refresh) {
    const now = new Date();
    const active = refresh.expiresAt > now;

    return res.json({
      active,
      scope: refresh.scope ?? null,
      clientId: refresh.clientId,
      userId: refresh.userId,
      exp: Math.floor(refresh.expiresAt.getTime() / 1000),
      token_type: "refresh_token",
    });
  }

  return res.json({ active: false });
}
