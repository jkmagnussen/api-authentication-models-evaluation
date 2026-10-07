import { prisma } from '../db';
import APP_CONFIG from '../config';

function getSessionExpiry() {
  // Keep persisted session validity aligned with the configured session lifetime.
  return new Date(Date.now() + APP_CONFIG.session.ttlSeconds * 1000);
}

export async function createSession(userId: string) {
  return prisma.session.create({
    data: {
      userId,
      expiresAt: getSessionExpiry(),
    },
  });
}

export async function createSessionWithId(userId: string, sessionId: string) {
  await prisma.session.deleteMany({ where: { id: sessionId } });

  return prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt: getSessionExpiry(),
    },
  });
}

export async function deleteSession(sessionId: string) {
  return prisma.session.delete({
    where: { id: sessionId },
  });
}

export async function findSession(sessionId: string) {
  return prisma.session.findUnique({
    where: { id: sessionId },
  });
}

// ⭐ Add this back — sessions login needs it
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}
