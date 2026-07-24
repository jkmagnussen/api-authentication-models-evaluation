import { validateAuthorize } from '../../../src/oauth/oauth.middleware';
import { prisma } from '../../../src/db';
import { Request, Response } from 'express';

// Mock ONLY the Prisma calls used by the middleware
jest.mock('../../../src/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

function mockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('validateAuthorize', () => {
  it('rejects missing userId', async () => {
    const req = { body: {} } as Request;
    const res = mockResponse();
    const next = jest.fn();

    await validateAuthorize(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects numeric userId', async () => {
    const req = { body: { userId: '123' } } as Request;
    const res = mockResponse();
    const next = jest.fn();

    await validateAuthorize(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid UUID format', async () => {
    const req = { body: { userId: 'abc' } } as Request;
    const res = mockResponse();
    const next = jest.fn();

    await validateAuthorize(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects non-existent user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = { body: { userId: 'b255a7cd-37a8-4784-98e1-dae9ffdc15ec' } } as Request;
    const res = mockResponse();
    const next = jest.fn();

    await validateAuthorize(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'b255a7cd-37a8-4784-98e1-dae9ffdc15ec',
    });

    const req = { body: { userId: 'b255a7cd-37a8-4784-98e1-dae9ffdc15ec' } } as Request;
    const res = mockResponse();
    const next = jest.fn();

    await validateAuthorize(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
