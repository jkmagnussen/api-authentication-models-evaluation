#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const venvDir = path.join(rootDir, 'analysis-python', '.venv');
const isWindows = process.platform === 'win32';
const pythonPath = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');
const requirementsPath = path.join(rootDir, 'analysis-python', 'requirements.txt');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureVenv() {
  if (!fs.existsSync(pythonPath)) {
    run('uv', ['venv', '--allow-existing', venvDir]);
  }
}

function installDependencies() {
  ensureVenv();
  run('uv', ['pip', 'install', '--python', pythonPath, '-r', requirementsPath]);
}

function runScript(scriptPath, scriptArgs) {
  ensureVenv();
  const resolvedScriptPath = path.isAbsolute(scriptPath)
    ? scriptPath
    : path.join(rootDir, scriptPath);
  run('uv', ['run', '--python', pythonPath, resolvedScriptPath, ...scriptArgs]);
}

const command = process.argv[2];
const scriptPath = process.argv[3];
const scriptArgs = process.argv.slice(4);

if (command === '--install') {
  installDependencies();
} else if (command === '--run') {
  if (!scriptPath) {
    console.error('Usage: node scripts/run-python-env.js --run <script> [args...]');
    process.exit(1);
  }
  runScript(scriptPath, scriptArgs);
} else {
  console.error('Usage: node scripts/run-python-env.js --install | --run <script> [args...]');
  process.exit(1);
}
