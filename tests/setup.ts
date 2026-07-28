import { prisma } from '../src/db';
import { authLimiter } from '../src/middleware/rateLimiter';

type DeleteManyModel = {
  deleteMany: () => Promise<unknown>;
};

type OAuthClientCreateModel = {
  create: (args: { data: { id: string; name: string; secret: string } }) => Promise<unknown>;
};

function getModel(name: string): unknown {
  const prismaRecord = prisma as unknown as Record<string, unknown>;
  return prismaRecord[name];
}

function isDeleteManyModel(model: unknown): model is DeleteManyModel {
  if (!model || typeof model !== 'object') {
    return false;
  }

  const candidate = model as { deleteMany?: unknown };
  return typeof candidate.deleteMany === 'function';
}

function isOAuthClientCreateModel(model: unknown): model is OAuthClientCreateModel {
  if (!model || typeof model !== 'object') {
    return false;
  }

  const candidate = model as { create?: unknown };
  return typeof candidate.create === 'function';
}

async function safeDeleteMany(model: unknown) {
  if (!isDeleteManyModel(model)) return;

  try {
    await model.deleteMany();
  } catch {
    // ignore FK errors during test cleanup
  }
}

async function safeCreateOAuthClient(id: string, name: string, secret: string) {
  const oauthClient = getModel('oAuthClient');
  if (!isOAuthClientCreateModel(oauthClient)) return;

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

  await safeDeleteMany(getModel('oAuthAccessToken'));
  await safeDeleteMany(getModel('oAuthAuthorizationCode'));
  await safeDeleteMany(getModel('passwordResetToken'));
  await safeDeleteMany(getModel('auditLog'));
  await safeDeleteMany(getModel('session'));
  await safeDeleteMany(getModel('oAuthClient'));
  await safeDeleteMany(getModel('user'));

  await safeCreateOAuthClient('client-basic', 'Basic Client', 'basic-secret');
  await safeCreateOAuthClient('client-privileged', 'Privileged Client', 'privileged-secret');
  await safeCreateOAuthClient('client-admin', 'Admin Client', 'admin-secret');
  await safeCreateOAuthClient('client-123', 'Legacy Test Client', 'legacy-secret');
}

export async function resetAuthState() {
  await resetDatabase();
}
