const http = require('http');
require('dotenv/config');

const port = Number(process.env.PORT || '3001');
const host = process.env.HEALTHCHECK_HOST || '127.0.0.1';
const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 5000);
const url = `http://${host}:${port}/health/live`;

const request = http.get(
  {
    host,
    port,
    path: '/health/live',
    timeout: timeoutMs,
  },
  (response) => {
    response.resume();
    if (response.statusCode === 200) {
      console.log(`Healthcheck passed: ${url} returned HTTP 200.`);
      return;
    }

    console.error(`Healthcheck failed: ${url} returned HTTP ${response.statusCode}.`);
    process.exitCode = 1;
  }
);

request.on('timeout', () => {
  request.destroy(new Error('healthcheck timeout'));
});

request.on('error', (error) => {
  console.error(`Healthcheck failed: could not reach ${url} (${error.message}).`);
  process.exitCode = 1;
});
