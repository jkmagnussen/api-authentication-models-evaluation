import fs from "fs";
import path from "path";
import { createHash } from "crypto";

type FrozenFileRecord = {
  path: string;
  sha256: string;
  bytes: number;
};

type OfflineFreezeLock = {
  protectedRoots: string[];
  files: FrozenFileRecord[];
};

const ROOT = process.cwd();
const LOCK_PATH = path.join(ROOT, "docs", "generated", "OFFLINE_FREEZE_LOCK.json");

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function hashFile(filePath: string): string {
  const hash = createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function main(): void {
  if (!fs.existsSync(LOCK_PATH)) {
    throw new Error("Offline freeze lock is missing. Run: npm run freeze:offline");
  }

  const lock = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8")) as OfflineFreezeLock;
  const expectedByPath = new Map(lock.files.map((entry) => [entry.path, entry]));
  const actualPaths = new Set<string>();
  const errors: string[] = [];

  for (const expected of lock.files) {
    const absolute = path.join(ROOT, expected.path);
    actualPaths.add(expected.path);

    if (!fs.existsSync(absolute)) {
      errors.push(`Missing file: ${expected.path}`);
      continue;
    }

    const actualBytes = fs.statSync(absolute).size;
    const actualSha = hashFile(absolute);

    if (actualBytes !== expected.bytes) {
      errors.push(`Size mismatch: ${expected.path} expected=${expected.bytes} actual=${actualBytes}`);
    }

    if (actualSha !== expected.sha256) {
      errors.push(`Hash mismatch: ${expected.path}`);
    }
  }

  for (const root of lock.protectedRoots) {
    const absoluteRoot = path.join(ROOT, root);
    if (!fs.existsSync(absoluteRoot)) {
      continue;
    }

    const stack = [absoluteRoot];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const absolutePath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(absolutePath);
          continue;
        }
        if (!entry.isFile()) {
          continue;
        }

        const relative = normalizePath(path.relative(ROOT, absolutePath));
        if (relative === "docs/generated/OFFLINE_FREEZE_LOCK.json") {
          continue;
        }
        if (!expectedByPath.has(relative)) {
          errors.push(`Untracked file in protected roots: ${relative}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error("Offline freeze verification failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Offline freeze verification passed for ${lock.files.length} files.`);
}

main();
