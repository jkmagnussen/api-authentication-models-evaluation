const { execFileSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const targets = [
  'coverage',
  'dist',
  'docs/generated',
  'docs/performance-results',
  'ai-generated/results',
  'ai-generated/arms',
  'reports/mutation'
];

try {
  execFileSync('git', ['clean', '-fdX', '--', ...targets], {
    cwd: repoRoot,
    stdio: 'inherit'
  });
  console.log('Removed ignored generated artifacts (tracked files left intact).');
} catch (error) {
  console.error('Failed to clean ignored artifacts.');
  process.exit(error.status || 1);
}
