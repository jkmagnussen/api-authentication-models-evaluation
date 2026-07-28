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

function startServer(port = getPreferredPort(), host = getPreferredHost(), attempts = 0) {
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

  const server = app.listen(port, host, () => {
    const actualPort = (server.address() as { port: number } | null)?.port ?? port;
    const actualHost = host === '0.0.0.0' ? 'localhost' : host;

    process.env.PORT = String(actualPort);
    process.env.HOST = host;

    log('info', 'server.started', {
      port: actualPort,
      host,
      url: `http://${actualHost}:${actualPort}`,
    });
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && attempts < 4) {
      const nextPort = port + 1;
      log('warn', 'server.port.in_use', {
        attemptedPort: port,
        nextPort,
      });
      startServer(nextPort, host, attempts + 1);
      return;
    }

    log('error', 'server.failed', {
      error: error.message,
      code: error.code,
      port,
    });
    process.exit(1);
  });
}

void startServer();
