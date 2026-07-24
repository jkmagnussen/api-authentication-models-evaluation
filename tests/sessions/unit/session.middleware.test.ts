import { prisma } from '../../../src/db';
import { requireSession } from '../../../src/sessions/sessions.middleware';
import bcrypt from 'bcrypt';
import { resetDatabase } from '../../setup';

describe('Session Middleware – Unit Tests', () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: 'user-123',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
      },
    });
  });

  test('Rejects missing cookie', async () => {
    const req: any = { cookies: {} };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await requireSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No session cookie' });
    expect(next).not.toHaveBeenCalled();
  });

  test('Rejects invalid session', async () => {
    const req: any = { cookies: { sessionId: 'invalid' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await requireSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid session' });
    expect(next).not.toHaveBeenCalled();
  });

  test('Allows valid session', async () => {
    const session = await prisma.session.create({
      data: {
        id: 'valid-session',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 10000),
      },
    });

    const req: any = { cookies: { sessionId: session.id } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await requireSession(req, res, next);

    expect(req.userId).toBe('user-123');
    expect(next).toHaveBeenCalled();
  });
});
