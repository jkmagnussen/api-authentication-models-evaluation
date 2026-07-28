import { prisma } from '../src/db';
import { authLimiter } from '../src/middleware/rateLimiter';

async function safeDeleteMany(model: any) {
  if (!model?.deleteMany) return;

  try {
    await model.deleteMany();
  } catch {
    // ignore FK errors during test cleanup
  }
}

async function safeCreateOAuthClient(id: string, name: string, secret: string) {
  const oauthClient = (prisma as any).oAuthClient;
  if (!oauthClient?.create) return;

  try {
    await oauthClient.create({
      data: { id, name, secret },
    });
  } catch {
    // ignore if the client already exists during test reset
  }
}

export { safeDeleteMany };

export async function resetDatabase() {
  authLimiter.resetKey('127.0.0.1');
  authLimiter.resetKey('::ffff:127.0.0.1');

  await safeDeleteMany((prisma as any).oAuthAccessToken);
  await safeDeleteMany((prisma as any).oAuthAuthorizationCode);
  await safeDeleteMany((prisma as any).passwordResetToken);
  await safeDeleteMany((prisma as any).auditLog);
  await safeDeleteMany((prisma as any).session);
  await safeDeleteMany((prisma as any).oAuthClient);
  await safeDeleteMany((prisma as any).user);

  await safeCreateOAuthClient('client-basic', 'Basic Client', 'basic-secret');
  await safeCreateOAuthClient('client-privileged', 'Privileged Client', 'privileged-secret');
  await safeCreateOAuthClient('client-admin', 'Admin Client', 'admin-secret');
  await safeCreateOAuthClient('client-123', 'Legacy Test Client', 'legacy-secret');
}

export async function resetAuthState() {
  await resetDatabase();
}
