import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/db';
import { resetDatabase } from '../../setup';

const validUUID = '123e4567-e89b-12d3-a456-426614174000';

describe('Login enumeration', () => {
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

  it('does not reveal account existence on sessions login', async () => {
    const unknown = await request(app)
      .post('/sessions/login')
      .send({ email: 'unknown@example.com', password: 'password' });

    const wrongPassword = await request(app)
      .post('/sessions/login')
      .send({ email: 'test@example.com', password: 'wrong-password' });

    expect(unknown.status).toBe(wrongPassword.status);
    expect(unknown.body).toEqual(wrongPassword.body);
    expect(unknown.body.message).toBe('Invalid credentials');
  });
});
