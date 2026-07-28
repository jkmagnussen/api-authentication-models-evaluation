import './express-session-augment';
import 'dotenv/config';
import app from './app';
import { PORT, validateRuntimeConfig } from './config';
import { log } from './logger';

export function getPreferredPort() {
  return Number(process.env.PORT ?? PORT);
}

export function getPreferredHost() {
  return process.env.HOST ?? '0.0.0.0';
}

async function startServer() {
  const configValidation = validateRuntimeConfig();

  for (const warning of configValidation.warnings) {
    log('warn', 'runtime.config.warning', { warning });
  }

  if (configValidation.errors.length > 0) {
    for (const error of configValidation.errors) {
      log('error', 'runtime.config.error', { error });
    }
    process.exit(1);
  }

  const preferredPort = getPreferredPort();
  const preferredHost = getPreferredHost();
  const server = app.listen(preferredPort, preferredHost, () => {
    log('info', 'server.started', {
      port: preferredPort,
      host: preferredHost,
      url: `http://${preferredHost === '0.0.0.0' ? 'localhost' : preferredHost}:${preferredPort}`,
    });
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    log('error', 'server.failed', {
      error: error.message,
      code: error.code,
    });
    process.exit(1);
  });
}

void startServer();
