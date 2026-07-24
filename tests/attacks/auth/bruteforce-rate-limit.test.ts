import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/db';
import { resetDatabase } from '../../setup';

const validUUID = '123e4567-e89b-12d3-a456-426614174000';

describe('Brute-force and rate-limit bypass', () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: validUUID,
        email: 'test@example.com',
        password: 'password',
      },
    });
  });

  it('throttles repeated failed logins from the same source', async () => {
    const statuses: number[] = [];

    for (let i = 0; i < 6; i += 1) {
      const res = await request(app)
        .post('/jwt/login')
        .send({ email: 'test@example.com', password: 'wrong-password' });
      statuses.push(res.status);
    }

    expect(statuses.some((status) => status === 429)).toBe(true);
  });

  it('does not allow bypass by spoofing X-Forwarded-For', async () => {
    const statuses: number[] = [];

    for (let i = 0; i < 6; i += 1) {
      const res = await request(app)
        .post('/jwt/login')
        .set('X-Forwarded-For', `10.0.0.${i + 1}`)
        .send({ email: 'test@example.com', password: 'wrong-password' });
      statuses.push(res.status);
    }

    expect(statuses.some((status) => status === 429)).toBe(true);
  });
});
