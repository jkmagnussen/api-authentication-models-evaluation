import { APP_CONFIG } from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: LogLevel) {
  const configuredLevel = (APP_CONFIG.observability.logLevel as LogLevel) || 'info';
  return levelWeight[level] >= levelWeight[configuredLevel];
}

export function log(level: LogLevel, message: string, extra: Record<string, unknown> = {}) {
  if (!shouldLog(level)) return;

  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...extra,
  };

  const line = JSON.stringify(payload);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}
