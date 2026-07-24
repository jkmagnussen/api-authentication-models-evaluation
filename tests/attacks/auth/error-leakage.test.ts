import request from 'supertest';
import app from '../../../src/app';

describe('Error-body leakage checks', () => {
  function hasLeakage(body: any) {
    const serialized = JSON.stringify(body ?? {});
    return (
      serialized.includes('stack') ||
      serialized.includes('at ') ||
      serialized.toLowerCase().includes('prisma') ||
      serialized.toLowerCase().includes('sql')
    );
  }

  it('does not leak internal details for malformed JWT login payload', async () => {
    const res = await request(app)
      .post('/jwt/login')
      .send({ email: { bad: true }, password: [] });

    expect(res.status).toBe(400);
    expect(hasLeakage(res.body)).toBe(false);
  });

  it('does not leak internal details for malformed OAuth token payload', async () => {
    const res = await request(app)
      .post('/oauth/token')
      .send({ code: { broken: true } });

    expect(res.status).toBe(400);
    expect(hasLeakage(res.body)).toBe(false);
  });

  it('does not leak stack traces on unknown route', async () => {
    const res = await request(app).post('/does-not-exist').send({ any: 'value' });

    expect([404, 500]).toContain(res.status);
    expect(hasLeakage(res.body)).toBe(false);
  });
});
