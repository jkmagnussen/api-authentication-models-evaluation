import crypto from 'crypto';
import { prisma } from '../db';
import { APP_CONFIG } from '../config';
import { findUserByEmail } from './user';
import { hashPassword, isValidPassword } from './password';
import { writeAuditEvent } from '../security/audit.service';
import { buildOtpAuthUrl, generateTotpSecret, verifyTotp } from './totp';
type RequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

function hashResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function requestPasswordReset(email: string, context: RequestContext) {
  const user = await findUserByEmail(email);

  if (!user) {
    await writeAuditEvent({
      eventType: 'password_reset.request',
      outcome: 'failure',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { email },
    });
    return null;
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashResetToken(token);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await writeAuditEvent({
    userId: user.id,
    eventType: 'password_reset.request',
    outcome: 'success',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return APP_CONFIG.isProduction ? null : token;
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string,
  context: RequestContext
) {
  const tokenHash = hashResetToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    await writeAuditEvent({
      eventType: 'password_reset.confirm',
      outcome: 'failure',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return false;
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await writeAuditEvent({
    userId: record.userId,
    eventType: 'password_reset.confirm',
    outcome: 'success',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return true;
}

export async function startMfaEnrollment(email: string, password: string, context: RequestContext) {
  const user = await findUserByEmail(email);

  if (!user || !(await isValidPassword(password, user.password))) {
    await writeAuditEvent({
      eventType: 'mfa.enroll',
      outcome: 'failure',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { email },
    });
    return null;
  }

  const secret = generateTotpSecret();
  const issuer = process.env.MFA_ISSUER ?? 'API Auth Evaluation';
  const otpauthUrl = buildOtpAuthUrl(user.email, issuer, secret);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfaSecret: secret,
      mfaEnabled: false,
    },
  });

  await writeAuditEvent({
    userId: user.id,
    eventType: 'mfa.enroll',
    outcome: 'success',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return {
    secret,
    otpauthUrl,
  };
}

export async function verifyMfaEnrollment(email: string, code: string, context: RequestContext) {
  const user = await findUserByEmail(email);

  if (!user?.mfaSecret) {
    await writeAuditEvent({
      eventType: 'mfa.verify',
      outcome: 'failure',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { email },
    });
    return false;
  }

  const valid = verifyTotp(code, user.mfaSecret);

  if (!valid) {
    await writeAuditEvent({
      userId: user.id,
      eventType: 'mfa.verify',
      outcome: 'failure',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return false;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { mfaEnabled: true },
  });

  await writeAuditEvent({
    userId: user.id,
    eventType: 'mfa.verify',
    outcome: 'success',
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return true;
}

export async function validateMfaForUser(userId: string, code: string | undefined) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.mfaEnabled) {
    return true;
  }

  if (!code || !user.mfaSecret) {
    return false;
  }

  return verifyTotp(code, user.mfaSecret);
}
