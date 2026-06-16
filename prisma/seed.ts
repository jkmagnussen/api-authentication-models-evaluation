import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";
import { BCRYPT_SALT_ROUNDS } from "../src/config";
const prisma = new PrismaClient();

async function main() {
  const user1Password = await bcrypt.hash("password1", BCRYPT_SALT_ROUNDS);
  const user2Password = await bcrypt.hash("password2", BCRYPT_SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {
      password: user1Password
    },
    create: {
      email: "user@example.com",
      password: user1Password
    }
  });

  await prisma.user.upsert({
    where: { email: "user2@example.com" },
    update: {
      password: user2Password
    },
    create: {
      email: "user2@example.com",
      password: user2Password
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
