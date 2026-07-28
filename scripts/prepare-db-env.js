#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const net = require('net');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

function parseEnvFile(content) {
  const values = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    let value = rawValue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function serializeEnvFile(values) {
  return Object.entries(values)
    .map(([key, value]) => `${key}="${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
    .join('\n') + '\n';
}

function readEnvFile() {
  if (!fs.existsSync(envPath)) return {};
  return parseEnvFile(fs.readFileSync(envPath, 'utf8'));
}

function writeEnvFile(values) {
  fs.writeFileSync(envPath, serializeEnvFile(values));
}

function normalizeValue(value, fallback) {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function parseDatabaseUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'postgresql:' ? '5432' : ''),
      pathname: parsed.pathname.replace(/^\//, ''),
      username: decodeURIComponent(parsed.username || ''),
      password: decodeURIComponent(parsed.password || ''),
    };
  } catch {
    return null;
  }
}

function detectPort(host, candidates) {
  return new Promise((resolve) => {
    const tryNext = (index) => {
      if (index >= candidates.length) {
        resolve(null);
        return;
      }

      const port = candidates[index];
      const socket = new net.Socket();
      const timer = setTimeout(() => {
        socket.destroy();
        tryNext(index + 1);
      }, 300);

      socket.once('connect', () => {
        clearTimeout(timer);
        socket.destroy();
        resolve(port);
      });
      socket.once('error', () => {
        clearTimeout(timer);
        tryNext(index + 1);
      });
      socket.connect({ host, port });
    };

    tryNext(0);
  });
}

async function main() {
  const existingEnv = readEnvFile();
  const existingDatabaseUrl = normalizeValue(process.env.DATABASE_URL, existingEnv.DATABASE_URL);
  const existingParsed = parseDatabaseUrl(existingDatabaseUrl);

  const host = normalizeValue(firstDefined(process.env.DB_HOST, process.env.POSTGRES_HOST, existingParsed?.host), 'localhost');
  const user = normalizeValue(firstDefined(process.env.DB_USER, process.env.POSTGRES_USER, existingParsed?.username), 'postgres');
  const password = normalizeValue(firstDefined(process.env.DB_PASSWORD, process.env.POSTGRES_PASSWORD, existingParsed?.password), 'password');
  const database = normalizeValue(firstDefined(process.env.DB_NAME, process.env.POSTGRES_DB, process.env.POSTGRES_DBNAME, existingParsed?.pathname), 'dissertation_auth_db');

  let port = normalizeValue(firstDefined(process.env.DB_PORT, process.env.POSTGRES_PORT, existingParsed?.port), '5432');

  if (!existingDatabaseUrl && !process.env.DATABASE_URL && !process.env.DB_PORT && !process.env.POSTGRES_PORT) {
    const detectedPort = await detectPort(host, ['5432', '5433', '5434', '5435', '15432']);
    if (detectedPort) {
      port = String(detectedPort);
    }
  }

  const nextUrl = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  const updatedEnv = { ...existingEnv, DATABASE_URL: nextUrl };
  writeEnvFile(updatedEnv);

  process.env.DATABASE_URL = nextUrl;
  console.log(`[db-env] Set DATABASE_URL using host=${host} port=${port} database=${database}`);
}

main().catch((error) => {
  console.error('[db-env] Failed to prepare database environment:', error);
  process.exit(1);
});
