import { Request, Response, NextFunction } from 'express';
import { findUserByEmail } from '../auth/user';
import { isValidPassword } from '../auth/password';
import { createSession } from './session.service';
import { createSessionWithId, deleteSession } from './session.service';
import { getVariantOverrides } from '../variant-overrides';
import APP_CONFIG from '../config';
import { validateMfaForUser } from '../auth/account-security.service';
import { writeAuditEvent } from '../security/audit.service';

export async function loginWithSession(req: Request, res: Response, next: NextFunction) {
  try {
    const variantOverrides = getVariantOverrides();
    const regenerateOnLogin = variantOverrides.sessions?.regenerateOnLogin ?? true;
    const sessionCookieOverride = variantOverrides.sessions?.cookie;

    const { email, password, mfaCode } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      await writeAuditEvent({
        eventType: 'session.login',
        outcome: 'failure',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { email },
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await isValidPassword(password, user.password);
    if (!match) {
      await writeAuditEvent({
        userId: user.id,
        eventType: 'session.login',
        outcome: 'failure',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const mfaValid = await validateMfaForUser(user.id, mfaCode);
    if (!mfaValid) {
      await writeAuditEvent({
        userId: user.id,
        eventType: 'session.login',
        outcome: 'failure',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { reason: 'mfa' },
      });
      return res.status(401).json({ message: 'MFA required or invalid code' });
    }

    const existingSessionId = req.cookies?.sessionId;
    if (existingSessionId && regenerateOnLogin) {
      await deleteSession(existingSessionId).catch(() => undefined);
    }

    const session =
      existingSessionId && !regenerateOnLogin
        ? await createSessionWithId(user.id, existingSessionId)
        : await createSession(user.id);

    res.cookie('sessionId', session.id, {
      httpOnly: sessionCookieOverride?.httpOnly ?? APP_CONFIG.cookie.httpOnly,
      secure: sessionCookieOverride?.secure ?? APP_CONFIG.cookie.secure,
      sameSite: sessionCookieOverride?.sameSite ?? APP_CONFIG.cookie.sameSite,
      domain: APP_CONFIG.cookie.domain,
      maxAge: APP_CONFIG.cookie.maxAgeMs,
    });

    await writeAuditEvent({
      userId: user.id,
      eventType: 'session.login',
      outcome: 'success',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(200).json({
      message: 'Session created',
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
    await deleteSession(sessionId); // delete from DB
  }

  res.clearCookie('sessionId', {
    httpOnly: APP_CONFIG.cookie.httpOnly,
    secure: APP_CONFIG.cookie.secure,
    sameSite: APP_CONFIG.cookie.sameSite,
    domain: APP_CONFIG.cookie.domain,
  }); // remove cookie

  await writeAuditEvent({
    eventType: 'session.logout',
    outcome: 'success',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  return res.json({ message: 'Logged out' });
}

export function getSessionProtected(req: Request, res: Response) {
  return res.json({
    message: 'Protected route accessed',
    userId: (req as any).userId, // set by requireSession middleware
  });
}
