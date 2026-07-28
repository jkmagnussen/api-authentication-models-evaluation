const { spawn } = require('child_process');
const path = require('path');

const child = spawn(process.execPath, [path.join(__dirname, '..', 'dist', 'src', 'server.js')], {
  cwd: path.join(__dirname, '..'),
  detached: true,
  stdio: 'inherit',
  env: process.env,
});

child.unref();

console.log('Started server in the background.');
