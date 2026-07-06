import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createSession(userId: string) {
  return prisma.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
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
