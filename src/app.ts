import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { prisma } from './db';

import oauthRoutes from './oauth/oauth.routes';
import sessionRoutes from './sessions/sessions.routes';
import jwtRoutes from './jwt/jwt.routes';
import accountSecurityRoutes from './auth/account-security.routes';
import { getVariantOverrides } from './variant-overrides';
import APP_CONFIG from './config';
import { log } from './logger';
import { buildSessionStore, getRedisStatus } from './session-store';

import { errorHandler } from './middleware/errorHandler';

const app = express();
const variantOverrides = getVariantOverrides();
const sessionCookieOverride = variantOverrides.sessions?.cookie;
const allowedCorsOrigins = new Set(APP_CONFIG.corsOrigins);

app.disable('x-powered-by');
if (APP_CONFIG.trustProxy) {
  app.set('trust proxy', 1);
}

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    if (req.path.startsWith('/health')) return;

    log('info', 'request.completed', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
    });
  });

  next();
});

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedCorsOrigins.size === 0 || allowedCorsOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

app.use(express.json());
app.use(cookieParser());

// Session middleware
app.use(
  session({
    name: 'appSessionId',
    secret: APP_CONFIG.session.secret,
    resave: false,
    saveUninitialized: false,
    proxy: APP_CONFIG.trustProxy,
    store: buildSessionStore(),
    cookie: {
      secure: sessionCookieOverride?.secure ?? APP_CONFIG.cookie.secure,
      httpOnly: sessionCookieOverride?.httpOnly ?? APP_CONFIG.cookie.httpOnly,
      sameSite: sessionCookieOverride?.sameSite ?? APP_CONFIG.cookie.sameSite,
      domain: APP_CONFIG.cookie.domain,
      maxAge: APP_CONFIG.cookie.maxAgeMs,
    },
  })
);

app.get('/', (_req, res) => {
  res.send('API running');
});

app.get('/health/live', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    res.json({
      status: 'ready',
      services: {
        database: 'ready',
        redis: getRedisStatus(),
      },
    });
  } catch (error) {
    log('error', 'health.ready.failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({
      status: 'degraded',
      services: {
        database: 'error',
        redis: getRedisStatus(),
      },
    });
  }
});

app.get('/metrics', (_req, res) => {
  res.json({
    uptimeSeconds: Math.round(process.uptime()),
    memoryRssBytes: process.memoryUsage().rss,
    redis: getRedisStatus(),
    env: APP_CONFIG.env,
  });
});

// Routes
app.use('/oauth', oauthRoutes);
app.use('/sessions', sessionRoutes);
app.use('/jwt', jwtRoutes);
app.use('/auth/security', accountSecurityRoutes);

app.use(errorHandler);

export default app;
