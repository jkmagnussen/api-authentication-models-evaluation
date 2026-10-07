// ⭐ Mock Prisma FIRST — before importing the service
jest.mock('../../../src/db', () => ({
  prisma: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { prisma } from '../../../src/db';
import APP_CONFIG from '../../../src/config';
import { createSession, createSessionWithId, findSession, deleteSession } from '../../../src/sessions/session.service';

describe('Session Service – Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createSession creates a session with correct fields', async () => {
    const startedAt = Date.now();
    const fakeSession = {
      id: 'session-123',
      userId: 'user-123',
      expiresAt: new Date(Date.now() + 3600000),
    };

    (prisma.session.create as jest.Mock).mockResolvedValue(fakeSession);

    const session = await createSession('user-123');

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        expiresAt: expect.any(Date),
      },
    });
    const createCall = (prisma.session.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.expiresAt.getTime()).toBeGreaterThanOrEqual(startedAt + APP_CONFIG.session.ttlSeconds * 1000);

    expect(session).toEqual(fakeSession);
  });

  test('createSessionWithId applies the configured TTL after replacing the supplied session ID', async () => {
    const startedAt = Date.now();
    (prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.session.create as jest.Mock).mockResolvedValue({});

    await createSessionWithId('user-123', 'fixed-session');

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { id: 'fixed-session' } });
    const createCall = (prisma.session.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data).toMatchObject({ id: 'fixed-session', userId: 'user-123' });
    expect(createCall.data.expiresAt.getTime()).toBeGreaterThanOrEqual(startedAt + APP_CONFIG.session.ttlSeconds * 1000);
  });

  test('findSession returns a session when it exists', async () => {
    const fakeSession = {
      id: 'session-123',
      userId: 'user-123',
      expiresAt: new Date(Date.now() + 3600000),
    };

    (prisma.session.findUnique as jest.Mock).mockResolvedValue(fakeSession);

    const found = await findSession('session-123');

    expect(prisma.session.findUnique).toHaveBeenCalledWith({
      where: { id: 'session-123' },
    });

    expect(found).toEqual(fakeSession);
  });

  test('deleteSession removes a session', async () => {
    (prisma.session.delete as jest.Mock).mockResolvedValue({});

    await deleteSession('session-123');

    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: { id: 'session-123' },
    });
  });
});
