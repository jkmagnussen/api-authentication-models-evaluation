const { spawn } = require('child_process');
const path = require('path');
require('dotenv/config');

function startServer({ timeoutMs = 30000 } = {}) {
  const expectedPort = Number(process.env.PORT || '3001');
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'dist', 'src', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    detached: true,
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    env: process.env,
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      fail(`Server did not start within ${timeoutMs}ms.`);
    }, timeoutMs);

    function fail(message) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (child.pid && child.exitCode === null && child.signalCode === null) {
        child.kill();
      }
      reject(new Error(message));
    }

    child.on('error', (error) => fail(`Could not start server: ${error.message}`));
    child.on('exit', (code, signal) =>
      fail(`Server exited before becoming ready (code: ${code}, signal: ${signal}).`)
    );
    child.on('message', (message) => {
      if (!message || message.type !== 'server.ready' || settled) return;
      if (message.port !== expectedPort) {
        fail(`Server started on port ${message.port}, but the healthcheck uses port ${expectedPort}.`);
        return;
      }
      settled = true;
      clearTimeout(timer);
      child.disconnect();
      child.unref();
      resolve(child.pid);
    });
  });
}

if (require.main === module) {
  startServer()
    .then((pid) => console.log(`Started server in the background (PID ${pid}).`))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}

module.exports = { startServer };
