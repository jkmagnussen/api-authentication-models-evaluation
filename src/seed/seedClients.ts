import { prisma } from "../db";

// npx ts-node src/seed/seedClients.ts

async function main() {
  await prisma.oAuthClient.upsert({
    where: { id: "client-123" },
    update: {},
    create: {
      id: "client-123",
      secret: "super-secret",
      name: "Test Client",
      redirectUri: "https://example.com/callback",
    },
  });
}

main().finally(() => process.exit(0));