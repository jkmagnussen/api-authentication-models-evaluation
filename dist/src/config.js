"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_CONFIG = exports.BCRYPT_SALT_ROUNDS = exports.DATABASE_URL = exports.PORT = exports.IS_PRODUCTION = exports.NODE_ENV = void 0;
exports.validateRuntimeConfig = validateRuntimeConfig;
function asNumber(value, fallback) {
    if (!value)
        return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}
function asBoolean(value, fallback = false) {
    if (value === undefined)
        return fallback;
    return value === "true";
}
function asList(value, fallback = []) {
    if (!value)
        return fallback;
    return value.split(",").map((item) => item.trim()).filter(Boolean);
}
exports.NODE_ENV = process.env.NODE_ENV ?? "development";
exports.IS_PRODUCTION = exports.NODE_ENV === "production";
exports.PORT = asNumber(process.env.PORT, 3000);
exports.DATABASE_URL = process.env.DATABASE_URL ?? "";
exports.BCRYPT_SALT_ROUNDS = asNumber(process.env.BCRYPT_SALT_ROUNDS, 10);
exports.APP_CONFIG = {
    env: exports.NODE_ENV,
    isProduction: exports.IS_PRODUCTION,
    port: exports.PORT,
    databaseUrl: exports.DATABASE_URL,
    bcryptSaltRounds: exports.BCRYPT_SALT_ROUNDS,
    trustProxy: asBoolean(process.env.TRUST_PROXY, exports.IS_PRODUCTION),
    corsOrigins: asList(process.env.CORS_ALLOWED_ORIGINS, exports.IS_PRODUCTION ? [] : ["http://localhost:3000"]),
    cookie: {
        secure: asBoolean(process.env.COOKIE_SECURE, exports.IS_PRODUCTION),
        httpOnly: asBoolean(process.env.COOKIE_HTTP_ONLY, true),
        sameSite: (process.env.COOKIE_SAME_SITE ?? (exports.IS_PRODUCTION ? "lax" : "lax")),
        domain: process.env.COOKIE_DOMAIN,
        maxAgeMs: asNumber(process.env.SESSION_COOKIE_MAX_AGE_MS, 24 * 60 * 60 * 1000),
    },
    session: {
        secret: process.env.SESSION_SECRET ?? "dev-session-secret",
        redisUrl: process.env.REDIS_URL,
        ttlSeconds: asNumber(process.env.SESSION_TTL_SECONDS, 24 * 60 * 60),
    },
    jwt: {
        audience: process.env.JWT_AUDIENCE ?? "api-auth-eval",
        issuer: process.env.JWT_ISSUER ?? "api-auth-service",
        algorithm: process.env.JWT_ALGORITHM ?? "RS256",
        expiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
        activeKeyId: process.env.JWT_ACTIVE_KID ?? "default",
        privateKeyPem: process.env.JWT_PRIVATE_KEY_PEM,
        privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH,
        publicKeysJson: process.env.JWT_PUBLIC_KEYS_JSON,
        legacySecret: process.env.JWT_SECRET,
    },
    oauth: {
        accessTokenTtlSeconds: asNumber(process.env.OAUTH_ACCESS_TOKEN_TTL_SECONDS, 3600),
        refreshTokenTtlSeconds: asNumber(process.env.OAUTH_REFRESH_TOKEN_TTL_SECONDS, 30 * 24 * 60 * 60),
        authorizationCodeTtlSeconds: asNumber(process.env.OAUTH_AUTH_CODE_TTL_SECONDS, 5 * 60),
        requirePkce: asBoolean(process.env.OAUTH_REQUIRE_PKCE, exports.NODE_ENV !== "test"),
        allowedRedirects: asList(process.env.OAUTH_ALLOWED_REDIRECTS, ["https://example.com/callback"]),
    },
    observability: {
        logLevel: process.env.LOG_LEVEL ?? "info",
        healthToken: process.env.HEALTHCHECK_TOKEN,
    },
    security: {
        authRateLimitMax: asNumber(process.env.AUTH_RATE_LIMIT_MAX, exports.NODE_ENV === "test" ? 5 : 200),
    },
};
function validateRuntimeConfig() {
    const errors = [];
    const warnings = [];
    if (!exports.APP_CONFIG.databaseUrl) {
        errors.push("DATABASE_URL is required.");
    }
    if (exports.APP_CONFIG.isProduction && exports.APP_CONFIG.session.secret === "dev-session-secret") {
        errors.push("SESSION_SECRET must be set in production.");
    }
    if (exports.APP_CONFIG.isProduction && !exports.APP_CONFIG.cookie.secure) {
        warnings.push("COOKIE_SECURE is disabled in production.");
    }
    if (exports.APP_CONFIG.isProduction && !exports.APP_CONFIG.session.redisUrl) {
        warnings.push("REDIS_URL is not configured; Express sessions will fall back to in-memory storage.");
    }
    if (exports.APP_CONFIG.isProduction && exports.APP_CONFIG.corsOrigins.length === 0) {
        warnings.push("CORS_ALLOWED_ORIGINS is empty; browser-origin requests will be rejected.");
    }
    return { errors, warnings };
}
exports.default = exports.APP_CONFIG;
