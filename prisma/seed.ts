import 'dotenv/config';
import { prisma } from '../src/db';
import bcrypt from 'bcrypt';

// npx ts-node prisma/seed.ts

async function main() {
  process.stdout.write('Resetting seeded data...\n');

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.session.deleteMany(),
    prisma.oAuthAccessToken.deleteMany(),
    prisma.oAuthAuthorizationCode.deleteMany(),
    prisma.oAuthClient.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Seed main user with fixed ID
  const passwordHash = await bcrypt.hash('password123', 10);
  const basicSecretHash = await bcrypt.hash('basic-secret', 10);
  const privilegedSecretHash = await bcrypt.hash('privileged-secret', 10);
  const adminSecretHash = await bcrypt.hash('admin-secret', 10);

  await prisma.user.create({
    data: {
      id: 'd9c7dba3-3f97-4418-9f7b-f89d8fa5d925',
      email: 'main@example.com',
      password: passwordHash,
    },
  });

  // -----------------------------
  // BASIC CLIENT (read-only)
  // -----------------------------
  await prisma.oAuthClient.create({
    data: {
      id: 'client-basic',
      secret: basicSecretHash,
      name: 'Basic Client',
    },
  });

  // -----------------------------
  // PRIVILEGED CLIENT (read + write)
  // -----------------------------
  await prisma.oAuthClient.create({
    data: {
      id: 'client-privileged',
      secret: privilegedSecretHash,
      name: 'Privileged Client',
    },
  });

  // -----------------------------
  // ADMIN CLIENT (read + write + admin)
  // -----------------------------
  await prisma.oAuthClient.create({
    data: {
      id: 'client-admin',
      secret: adminSecretHash,
      name: 'Admin Client',
    },
  });

  process.stdout.write('Seed complete. Existing data was reset and reseeded.\n');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
