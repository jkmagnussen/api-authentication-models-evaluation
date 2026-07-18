import { prisma } from "../src/db";
import bcrypt from "bcrypt";

// npx ts-node src/seed/seedClients.ts

async function main() {
  // Seed main user with fixed ID
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { id: "d9c7dba3-3f97-4418-9f7b-f89d8fa5d925" },
    update: {},
    create: {
      id: "d9c7dba3-3f97-4418-9f7b-f89d8fa5d925",
      email: "main@example.com",
      password: passwordHash,
    },
  });

  // Seed OAuth client
  await prisma.oAuthClient.upsert({
    where: { id: "client-123" },
    update: {},
    create: {
      id: "client-123",
      secret: "super-secret",
      name: "Test Client",
    },
  });

  console.log("Seed complete.");
}

main().finally(() => process.exit(0));
