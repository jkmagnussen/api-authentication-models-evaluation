// tests/setup.ts

import { prisma } from "../src/db";
import { authLimiter } from "../src/middleware/rateLimiter";

async function safeDeleteMany(model: any) {
  if (!model?.deleteMany) return;
  const promise = model.deleteMany();
  if (promise?.catch) {
    return promise.catch(() => {});
  }
  return promise;
}

export async function resetDatabase() {
  authLimiter.resetKey("127.0.0.1");
  authLimiter.resetKey("::ffff:127.0.0.1");

  await safeDeleteMany((prisma as any).oAuthAccessToken);
  await safeDeleteMany((prisma as any).oAuthAuthorizationCode);
  await safeDeleteMany((prisma as any).session);
  await safeDeleteMany((prisma as any).oAuthClient);
  await safeDeleteMany((prisma as any).user);

  const oauthClient = (prisma as any).oAuthClient;
  if (oauthClient?.create) {
    await oauthClient.create({
      data: {
        id: "client-123",
        name: "Test Client",
        secret: "test-secret",
      },
    }).catch(() => {});
  }
}

export async function resetAuthState() {
  await resetDatabase();
}

