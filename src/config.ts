function asNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return value === 'true';
}

function asList(value: string | undefined, fallback: string[] = []) {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildDatabaseUrlFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const existingDatabaseUrl = env.DATABASE_URL?.trim();
  if (existingDatabaseUrl) {
    return existingDatabaseUrl;
  }

  const host = env.DB_HOST ?? env.POSTGRES_HOST ?? 'localhost';
  const port = env.DB_PORT ?? env.POSTGRES_PORT ?? '5432';
  const user = env.DB_USER ?? env.POSTGRES_USER ?? 'postgres';
  const password = env.DB_PASSWORD ?? env.POSTGRES_PASSWORD ?? 'password';
  const database = env.DB_NAME ?? env.POSTGRES_DB ?? env.POSTGRES_DBNAME ?? 'dissertation_auth_db';

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const PORT = asNumber(process.env.PORT, 3001);
export const DATABASE_URL = buildDatabaseUrlFromEnv();
export const BCRYPT_SALT_ROUNDS = asNumber(process.env.BCRYPT_SALT_ROUNDS, 10);

export const APP_CONFIG = {
  env: NODE_ENV,
  isProduction: IS_PRODUCTION,
  port: PORT,
  databaseUrl: DATABASE_URL,
  bcryptSaltRounds: BCRYPT_SALT_ROUNDS,
  trustProxy: asBoolean(process.env.TRUST_PROXY, IS_PRODUCTION),
  corsOrigins: asList(
    process.env.CORS_ALLOWED_ORIGINS,
    IS_PRODUCTION ? [] : ['http://localhost:3001']
  ),
  cookie: {
    secure: asBoolean(process.env.COOKIE_SECURE, IS_PRODUCTION),
    httpOnly: asBoolean(process.env.COOKIE_HTTP_ONLY, true),
    sameSite: (process.env.COOKIE_SAME_SITE ?? (IS_PRODUCTION ? 'lax' : 'lax')) as
      'lax' | 'strict' | 'none',
    domain: process.env.COOKIE_DOMAIN,
    maxAgeMs: asNumber(process.env.SESSION_COOKIE_MAX_AGE_MS, 24 * 60 * 60 * 1000),
  },
  session: {
    secret: process.env.SESSION_SECRET ?? 'dev-session-secret',
    redisUrl: process.env.REDIS_URL,
    ttlSeconds: asNumber(process.env.SESSION_TTL_SECONDS, 24 * 60 * 60),
  },
  jwt: {
    audience: process.env.JWT_AUDIENCE ?? 'api-auth-eval',
    issuer: process.env.JWT_ISSUER ?? 'api-auth-service',
    algorithm: process.env.JWT_ALGORITHM ?? 'RS256',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    activeKeyId: process.env.JWT_ACTIVE_KID ?? 'default',
    privateKeyPem: process.env.JWT_PRIVATE_KEY_PEM,
    privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH,
    publicKeysJson: process.env.JWT_PUBLIC_KEYS_JSON,
    legacySecret: process.env.JWT_SECRET,
  },
  oauth: {
    accessTokenTtlSeconds: asNumber(process.env.OAUTH_ACCESS_TOKEN_TTL_SECONDS, 3600),
    refreshTokenTtlSeconds: asNumber(
      process.env.OAUTH_REFRESH_TOKEN_TTL_SECONDS,
      30 * 24 * 60 * 60
    ),
    authorizationCodeTtlSeconds: asNumber(process.env.OAUTH_AUTH_CODE_TTL_SECONDS, 5 * 60),
    requirePkce: asBoolean(process.env.OAUTH_REQUIRE_PKCE, NODE_ENV !== 'test'),
    allowedRedirects: asList(process.env.OAUTH_ALLOWED_REDIRECTS, ['https://example.com/callback']),
  },
  observability: {
    logLevel: process.env.LOG_LEVEL ?? 'info',
    healthToken: process.env.HEALTHCHECK_TOKEN,
  },
  security: {
    authRateLimitMax: asNumber(process.env.AUTH_RATE_LIMIT_MAX, NODE_ENV === 'test' ? 5 : 200),
  },
};

export function validateRuntimeConfig() {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!APP_CONFIG.databaseUrl) {
    errors.push('DATABASE_URL is required.');
  }

  if (APP_CONFIG.isProduction && APP_CONFIG.session.secret === 'dev-session-secret') {
    errors.push('SESSION_SECRET must be set in production.');
  }

  if (APP_CONFIG.isProduction && !APP_CONFIG.cookie.secure) {
    warnings.push('COOKIE_SECURE is disabled in production.');
  }

  if (APP_CONFIG.isProduction && !APP_CONFIG.session.redisUrl) {
    warnings.push(
      'REDIS_URL is not configured; Express sessions will fall back to in-memory storage.'
    );
  }

  if (APP_CONFIG.isProduction && APP_CONFIG.corsOrigins.length === 0) {
    warnings.push('CORS_ALLOWED_ORIGINS is empty; browser-origin requests will be rejected.');
  }

  return { errors, warnings };
}

export default APP_CONFIG;
