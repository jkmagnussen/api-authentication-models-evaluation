import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: { name: "USER" }
  });

  await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" }
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
