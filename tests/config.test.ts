import { buildDatabaseUrlFromEnv } from '../src/config';

describe('buildDatabaseUrlFromEnv', () => {
  it('builds a database URL from DB_* variables when DATABASE_URL is not set', () => {
    const result = buildDatabaseUrlFromEnv({
      DB_HOST: 'db.internal',
      DB_PORT: '6543',
      DB_USER: 'app_user',
      DB_PASSWORD: 'secret-pass',
      DB_NAME: 'auth_eval',
    });

    expect(result).toBe('postgresql://app_user:secret-pass@db.internal:6543/auth_eval');
  });

  it('prefers an existing DATABASE_URL over individual DB environment variables', () => {
    const result = buildDatabaseUrlFromEnv({
      DATABASE_URL: 'postgresql://existing:pw@localhost:5432/existing_db',
      DB_HOST: 'ignored-host',
      DB_PORT: '9999',
      DB_USER: 'ignored-user',
      DB_PASSWORD: 'ignored-pass',
      DB_NAME: 'ignored-db',
    });

    expect(result).toBe('postgresql://existing:pw@localhost:5432/existing_db');
  });
});
