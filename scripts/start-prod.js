const { spawn } = require('child_process');
const path = require('path');

function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: false,
      windowsHide: true,
      ...options,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function runWithRetry(command, args, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await run(command, args);
      return;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function main() {
  try {
    const npmCommand = getNpmCommand();
    await run(npmCommand, ['run', 'prepare:env']);
    await runWithRetry(npmCommand, ['run', 'db:generate']);
    await run(npmCommand, ['run', 'db:migrate']);
    await run(npmCommand, ['run', 'db:seed']);
    await run(npmCommand, ['run', 'build']);

    const server = spawn(process.execPath, [path.join(__dirname, '..', 'dist', 'src', 'server.js')], {
      cwd: path.join(__dirname, '..'),
      detached: true,
      stdio: 'inherit',
      env: process.env,
    });

    server.unref();

    console.log(`Started production server with PID ${server.pid}`);

    for (let i = 0; i < 20; i += 1) {
      try {
        await run(process.execPath, ['scripts/healthcheck.js']);
        console.log('Healthcheck passed');
        return;
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.error('Production server failed healthcheck');
    process.exit(1);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
