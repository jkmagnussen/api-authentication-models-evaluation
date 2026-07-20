import { spawnSync } from "child_process";

export function runAllTests() {
  const result = spawnSync("npx", ["jest", "--runInBand"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  process.exit(result.status ?? 1);
}
