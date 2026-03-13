import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.role.createMany({
    data: [
      { name: "USER" },
      { name: "ADMIN" }
    ],
    skipDuplicates: true
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
