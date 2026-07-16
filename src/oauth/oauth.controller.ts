import { Request, Response } from "express";
import { prisma } from "../db";
import crypto from "crypto";
import { exchangeCodeForToken } from "./oauth.service";
import { writeAuditLog } from "./audit";

// ------------------------------------------------------
// AUTHORIZE (Authorization Code + PKCE)
// ------------------------------------------------------
export async function authorize(req: Request, res: Response) {
  const {
    userId,
    client_id,
    redirect_uri,
    state,
    scope,
    code_challenge,
    code_challenge_method
  } = req.body;

  if (!userId) {
    await writeAuditLog({
      event: "oauth.authorize",
      userId: null,
      clientId: client_id ?? null,
      ip: req.ip,
      success: false,
      errorCode: "missing_user_id"
    });
    return res.status(400).json({ error: "Missing userId" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    await writeAuditLog({
      event: "oauth.authorize",
      userId,
      clientId: client_id ?? null,
      ip: req.ip,
      success: false,
      errorCode: "user_not_found"
    });
    return res.status(400).json({ error: "User not found" });
  }

  const client = await prisma.oAuthClient.findUnique({
    where: { id: client_id },
  });

  if (!client) {
    await writeAuditLog({
      event: "oauth.authorize",
      userId,
      clientId: client_id,
      ip: req.ip,
      success: false,
      errorCode: "invalid_client_id"
    });
    return res.status(400).json({ error: "Invalid client_id" });
  }

  if (client.redirectUri !== redirect_uri) {
    await writeAuditLog({
      event: "oauth.authorize",
      userId,
      clientId: client_id,
      ip: req.ip,
      success: false,
      errorCode: "invalid_redirect_uri"
    });
    return res.status(400).json({ error: "Invalid redirect URI" });
  }

  const code = crypto.randomUUID();

  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      userId,
      clientId: client_id,
      redirectUri: redirect_uri,
      state: state ?? null,
      scope: scope ?? "read",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      codeChallenge: code_challenge ?? null,
      codeChallengeMethod: code_challenge_method ?? null,
    },
  });

  await writeAuditLog({
    event: "oauth.authorize",
    userId,
    clientId: client_id,
    ip: req.ip,
    success: true,
    details: `scope=${scope ?? "read"}`
  });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", code);
  if (state) redirectUrl.searchParams.set("state", state);

  return res.redirect(302, redirectUrl.toString());
}

// ------------------------------------------------------
// TOKEN (Authorization Code Exchange + PKCE + Client Auth)
// ------------------------------------------------------
export async function token(req: Request, res: Response) {
  const { code, state, code_verifier } = req.body;

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Basic ")) {
    await writeAuditLog({
      event: "oauth.token",
      success: false,
      ip: req.ip,
      errorCode: "invalid_client",
      details: "missing_basic_auth"
    });
    return res.status(401).json({
      error: "invalid_client",
      error_description: "Missing client authentication",
    });
  }

  const base64 = auth.replace("Basic ", "");
  const [client_id, client_secret] = Buffer.from(base64, "base64")
    .toString("utf8")
    .split(":");

  const client = await prisma.oAuthClient.findUnique({
    where: { id: client_id },
  });

  if (!client || client.secret !== client_secret) {
    await writeAuditLog({
      event: "oauth.token",
      clientId: client_id,
      ip: req.ip,
      success: false,
      errorCode: "invalid_client_credentials"
    });
    return res.status(401).json({
      error: "invalid_client",
      error_description: "Invalid client credentials",
    });
  }

  if (!code) {
    await writeAuditLog({
      event: "oauth.token",
      clientId: client_id,
      ip: req.ip,
      success: false,
      errorCode: "missing_code"
    });
    return res.status(400).json({ error: "Missing code" });
  }

  const stored = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  });

  if (!stored) {
    await writeAuditLog({
      event: "oauth.token",
      clientId: client_id,
      ip: req.ip,
      success: false,
      errorCode: "invalid_authorization_code"
    });
    return res.status(400).json({ error: "Invalid authorization code" });
  }

  if (stored.used) {
    await writeAuditLog({
      event: "oauth.token",
      userId: stored.userId,
      clientId: stored.clientId,
      ip: req.ip,
      success: false,
      errorCode: "authorization_code_used"
    });
    return res.status(400).json({ error: "Authorization code already used" });
  }

  if (stored.state && stored.state !== state) {
    await writeAuditLog({
      event: "oauth.token",
      userId: stored.userId,
      clientId: stored.clientId,
      ip: req.ip,
      success: false,
      errorCode: "invalid_state"
    });
    return res.status(400).json({ error: "Invalid state" });
  }

  if (stored.codeChallenge) {
    if (!code_verifier) {
      await writeAuditLog({
        event: "oauth.token",
        userId: stored.userId,
        clientId: stored.clientId,
        ip: req.ip,
        success: false,
        errorCode: "missing_code_verifier"
      });
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
      await writeAuditLog({
        event: "oauth.token",
        userId: stored.userId,
        clientId: stored.clientId,
        ip: req.ip,
        success: false,
        errorCode: "pkce_verification_failed"
      });
      return res.status(400).json({
        error: "invalid_grant",
        error_description: "PKCE verification failed",
      });
    }
  }

  await prisma.oAuthAuthorizationCode.update({
    where: { code },
    data: { used: true },
  });

  const token = await exchangeCodeForToken(code);

  if (!token) {
    await writeAuditLog({
      event: "oauth.token",
      userId: stored.userId,
      clientId: stored.clientId,
      ip: req.ip,
      success: false,
      errorCode: "token_exchange_failed"
    });
    return res.status(400).json({ error: "Invalid authorization code" });
  }

  await writeAuditLog({
    event: "oauth.token",
    userId: stored.userId,
    clientId: stored.clientId,
    ip: req.ip,
    success: true,
    details: `scope=${token.scope}`
  });

  return res.json({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    token_type: "Bearer",
    expires_in: 3600,
    scope: token.scope,
  });
}

// ------------------------------------------------------
// REFRESH TOKEN
// ------------------------------------------------------
export async function refresh(req: Request, res: Response) {
  const { refresh_token, client_id } = req.body;

  if (!refresh_token) {
    await writeAuditLog({
      event: "oauth.refresh",
      clientId: client_id ?? null,
      ip: req.ip,
      success: false,
      errorCode: "missing_refresh_token"
    });
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing refresh_token",
    });
  }

  const stored = await prisma.oAuthAccessToken.findUnique({
    where: { refreshToken: refresh_token },
  });

  if (!stored || stored.clientId !== client_id) {
    await writeAuditLog({
      event: "oauth.refresh",
      clientId: client_id,
      ip: req.ip,
      success: false,
      errorCode: "invalid_refresh_token"
    });
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

  await writeAuditLog({
    event: "oauth.refresh",
    userId: stored.userId,
    clientId: stored.clientId,
    ip: req.ip,
    success: true
  });

  return res.json({
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
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
    await writeAuditLog({
      event: "oauth.revoke",
      ip: req.ip,
      success: false,
      errorCode: "missing_token"
    });
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

    await writeAuditLog({
      event: "oauth.revoke",
      userId: access.userId,
      clientId: access.clientId,
      ip: req.ip,
      success: true
    });

    return res.status(200).send();
  }

  const refresh = await prisma.oAuthAccessToken.findUnique({
    where: { refreshToken: token },
  });

  if (refresh) {
    await prisma.oAuthAccessToken.delete({ where: { refreshToken: token } });

    await writeAuditLog({
      event: "oauth.revoke",
      userId: refresh.userId,
      clientId: refresh.clientId,
      ip: req.ip,
      success: true
    });

    return res.status(200).send();
  }

  await writeAuditLog({
    event: "oauth.revoke",
    ip: req.ip,
    success: false,
    errorCode: "token_not_found"
  });

  return res.status(200).send();
}

// ------------------------------------------------------
// TOKEN INTROSPECTION (RFC 7662)
// ------------------------------------------------------
export async function introspect(req: Request, res: Response) {
  const { token } = req.body;

  if (!token) {
    await writeAuditLog({
      event: "oauth.introspect",
      ip: req.ip,
      success: false,
      errorCode: "missing_token"
    });
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

    await writeAuditLog({
      event: "oauth.introspect",
      userId: access.userId,
      clientId: access.clientId,
      ip: req.ip,
      success: active,
      errorCode: active ? null : "token_expired"
    });

    return res.json({
      active,
      scope: access.scope ?? null,
      client_id: access.clientId,
      user_id: access.userId,
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

    await writeAuditLog({
      event: "oauth.introspect",
      userId: refresh.userId,
      clientId: refresh.clientId,
      ip: req.ip,
      success: active,
      errorCode: active ? null : "token_expired"
    });

    return res.json({
      active,
      scope: refresh.scope ?? null,
      client_id: refresh.clientId,
      user_id: refresh.userId,
      exp: Math.floor(refresh.expiresAt.getTime() / 1000),
      token_type: "refresh_token",
    });
  }

  await writeAuditLog({
    event: "oauth.introspect",
    ip: req.ip,
    success: false,
    errorCode: "token_not_found"
  });

  return res.json({ active: false });
}
