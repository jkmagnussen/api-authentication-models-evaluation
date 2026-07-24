// ⭐ Mock Prisma FIRST — before importing the service
jest.mock('../../../src/db', () => ({
  prisma: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '../../../src/db';
import { createSession, findSession, deleteSession } from '../../../src/sessions/session.service';

describe('Session Service – Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createSession creates a session with correct fields', async () => {
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

    expect(session).toEqual(fakeSession);
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
