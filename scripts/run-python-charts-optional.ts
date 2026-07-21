import { spawnSync } from "node:child_process";

function run(command: string, args: string[]): boolean {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  return (result.status ?? 1) === 0;
}

function main(): void {
  const attempts: Array<{ command: string; args: string[]; label: string }> = [
    {
      command: "python",
      args: ["analysis-python/generate_charts.py"],
      label: "python",
    },
    {
      command: "py",
      args: ["analysis-python/generate_charts.py"],
      label: "py",
    },
  ];

  for (const attempt of attempts) {
    console.log(`[py:charts:optional] Trying ${attempt.label}...`);
    if (run(attempt.command, attempt.args)) {
      console.log(`[py:charts:optional] Charts generated via ${attempt.label}.`);
      return;
    }
  }

  console.warn(
    "[py:charts:optional] Skipping chart generation: Python interpreter was not found."
  );
  console.warn(
    "[py:charts:optional] Install Python to enable docs/charts SVG generation."
  );
}

main();
