import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

type FrozenFileRecord = {
  path: string;
  sha256: string;
  bytes: number;
};

type OfflineFreezeLock = {
  generatedAt: string;
  mode: 'offline-freeze';
  notes: string;
  lockVersion: 1;
  blockLiveProviderGeneration: true;
  allowOverrideEnvVar: 'ALLOW_LIVE_AI_GENERATION';
  protectedRoots: string[];
  fileCount: number;
  totalBytes: number;
  files: FrozenFileRecord[];
};

const ROOT = process.cwd();
const LOCK_PATH = path.join(ROOT, 'docs', 'generated', 'OFFLINE_FREEZE_LOCK.json');
const PROTECTED_ROOTS = [
  'docs/generated',
  'docs/charts',
  'docs/performance-results',
  'ai-generated/results',
  'ai-generated/arms',
];

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function listFilesRecursively(baseDir: string): string[] {
  if (!fs.existsSync(baseDir)) {
    return [];
  }

  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursively(absolutePath));
      continue;
    }

    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function hashFile(filePath: string): string {
  const hash = createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function ensureParentDirectory(filePath: string): void {
  const parent = path.dirname(filePath);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
}

function main(): void {
  const allFiles = PROTECTED_ROOTS.flatMap((relativeRoot) =>
    listFilesRecursively(path.join(ROOT, relativeRoot))
  );
  const filtered = allFiles
    .map((absolutePath) => ({
      absolutePath,
      relativePath: normalizePath(path.relative(ROOT, absolutePath)),
      bytes: fs.statSync(absolutePath).size,
    }))
    .filter((item) => item.relativePath !== 'docs/generated/OFFLINE_FREEZE_LOCK.json')
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const files: FrozenFileRecord[] = filtered.map((item) => ({
    path: item.relativePath,
    sha256: hashFile(item.absolutePath),
    bytes: item.bytes,
  }));

  const lock: OfflineFreezeLock = {
    generatedAt: new Date().toISOString(),
    mode: 'offline-freeze',
    notes:
      'Live provider generation is blocked while this lock file exists. Remove it intentionally or set ALLOW_LIVE_AI_GENERATION=true to override.',
    lockVersion: 1,
    blockLiveProviderGeneration: true,
    allowOverrideEnvVar: 'ALLOW_LIVE_AI_GENERATION',
    protectedRoots: PROTECTED_ROOTS,
    fileCount: files.length,
    totalBytes: files.reduce((sum, entry) => sum + entry.bytes, 0),
    files,
  };

  ensureParentDirectory(LOCK_PATH);
  fs.writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');

  console.log(`Offline freeze lock written: ${normalizePath(path.relative(ROOT, LOCK_PATH))}`);
  console.log(`Protected files: ${lock.fileCount}`);
  console.log(`Total bytes fingerprinted: ${lock.totalBytes}`);
}

main();
