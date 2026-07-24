import { Request, Response } from 'express';
import { validateToken } from '../../../src/oauth/oauth.middleware';

function mockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('validateToken middleware', () => {
  it('returns 400 if code is missing', () => {
    const req = { body: {} } as Request;
    const res = mockResponse();
    const next = jest.fn();

    validateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'authorization code is required and must be a string',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() if code is present', () => {
    const req = { body: { code: 'abc123' } } as Request;
    const res = mockResponse();
    const next = jest.fn();

    validateToken(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
