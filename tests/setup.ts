// tests/setup.ts

import { prisma } from "../src/db";

async function safeDeleteMany(model: any) {
  if (!model?.deleteMany) return;
  const promise = model.deleteMany();
  if (promise?.catch) {
    return promise.catch(() => {});
  }
  return promise;
}

export async function resetDatabase() {
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
