import jwt from 'jsonwebtoken';
import { generateJwt } from '../../../src/jwt/jwt.service';

describe('JWT Signing – Unit Tests', () => {
  process.env.JWT_SECRET = 'test-secret';

  const SECRET = process.env.JWT_SECRET!;

  test('generateJwt returns a valid signed token', () => {
    const token = generateJwt('user-123');

    expect(token).toBeDefined();

    const decoded = jwt.verify(token, SECRET) as any;
    expect(decoded.userId).toBe('user-123');
  });

  test('Token contains standard JWT fields', () => {
    const token = generateJwt('user-123');
    const decoded = jwt.decode(token) as any;

    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  test('Token expires according to configured expiry', () => {
    const token = generateJwt('user-123');
    const decoded = jwt.decode(token) as any;

    const lifetime = decoded.exp - decoded.iat;
    expect(lifetime).toBeGreaterThan(0);
  });
});
