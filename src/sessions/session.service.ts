import { prisma } from "../db";



export async function createSession(userId: string) {
  return prisma.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    },
  });
}

export async function createSessionWithId(userId: string, sessionId: string) {
  await prisma.session.deleteMany({ where: { id: sessionId } });

  return prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
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