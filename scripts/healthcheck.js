const http = require('http');

const port = Number(process.env.PORT || '3001');
const host = process.env.HEALTHCHECK_HOST || '127.0.0.1';
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 5000);

const request = http.get(
  {
    host,
    port,
    path: '/health/live',
    timeout: timeoutMs,
  },
  (response) => {
    if (response.statusCode === 200) {
      process.exit(0);
      return;
    }

    process.exit(1);
  }
);

request.on('timeout', () => {
  request.destroy(new Error('healthcheck timeout'));
});

request.on('error', () => {
  process.exit(1);
});
