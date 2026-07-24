import { spawnSync } from 'child_process';

const repeatCount = Number(process.argv[2] ?? 5);

for (let index = 1; index <= repeatCount; index += 1) {
  const runId = `run-${String(index).padStart(2, '0')}`;
  console.log(`Starting performance repetition ${runId}`);

  const result = spawnSync('npm', ['test', '--', 'tests/performance'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PERF_RUN_ID: runId,
    },
  });

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

const analyzeResult = spawnSync('npm', ['run', 'perf:analyze'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(analyzeResult.status ?? 1);
