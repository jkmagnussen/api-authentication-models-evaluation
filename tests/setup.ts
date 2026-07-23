import { prisma } from "../src/db";
import { authLimiter } from "../src/middleware/rateLimiter";

async function safeDeleteMany(model: any) {
  if (!model?.deleteMany) return;
  try {
    await model.deleteMany();
  } catch {
    // ignore FK errors during test cleanup
  }
}

export { safeDeleteMany };

export async function resetDatabase() {
  authLimiter.resetKey("127.0.0.1");
  authLimiter.resetKey("::ffff:127.0.0.1");

  await safeDeleteMany((prisma as any).oAuthAccessToken);
  await safeDeleteMany((prisma as any).oAuthAuthorizationCode);
  await safeDeleteMany((prisma as any).passwordResetToken);
  await safeDeleteMany((prisma as any).auditLog);
  await safeDeleteMany((prisma as any).session);
  await safeDeleteMany((prisma as any).oAuthClient);
  await safeDeleteMany((prisma as any).user);

  const oauthClient = (prisma as any).oAuthClient;

  if (oauthClient?.create) {
    // Recreate clients used in tests.
    await oauthClient.create({
      data: {
        id: "client-basic",
        name: "Basic Client",
        secret: "basic-secret",
      },
    });

    await oauthClient.create({
      data: {
        id: "client-privileged",
        name: "Privileged Client",
        secret: "privileged-secret",
      },
    });

    await oauthClient.create({
      data: {
        id: "client-admin",
        name: "Admin Client",
        secret: "admin-secret",
      },
    });

    // Legacy client used by older tests.
    await oauthClient.create({
      data: {
        id: "client-123",
        name: "Legacy Test Client",
        secret: "legacy-secret",
      },
    });
  }
}

export async function resetAuthState() {
  await resetDatabase();
}