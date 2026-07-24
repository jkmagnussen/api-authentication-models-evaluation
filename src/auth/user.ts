import { prisma } from '../db';

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
