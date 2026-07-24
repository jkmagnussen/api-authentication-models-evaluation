import { prisma } from '../../../src/db';
import bcrypt from 'bcrypt';

export async function resetDatabase() {
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      id: 'user-123',
      email: 'test@example.com',
      password: await bcrypt.hash('password', 10),
    },
  });
}
