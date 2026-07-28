#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function removePrismaEngineArtifacts(rootDir = process.cwd()) {
  const targetDir = path.join(rootDir, 'node_modules', '.prisma', 'client');
  const removed = [];

  if (!fs.existsSync(targetDir)) {
    return removed;
  }

  const files = fs.readdirSync(targetDir);
  for (const file of files) {
    const shouldRemove =
      file.startsWith('query_engine') ||
      file.startsWith('libquery_engine') ||
      file.startsWith('query-engine');

    if (!shouldRemove) {
      continue;
    }

    const fullPath = path.join(targetDir, file);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        removed.push(file);
      } catch (error) {
        if (error && error.code !== 'EPERM' && error.code !== 'EBUSY') {
          throw error;
        }
      }
    }
  }

  return removed;
}

function copyDirRecursive(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function ensurePrismaClientUsesLocalEngine(rootDir = process.cwd()) {
  const generatedClientEntry = path.join(
    rootDir,
    'node_modules',
    '@prisma',
    'client',
    'index.js'
  );

  if (!fs.existsSync(generatedClientEntry)) {
    return false;
  }

  const content = fs.readFileSync(generatedClientEntry, 'utf8');
  if (content.includes('"copyEngine": true')) {
    return true;
  }

  const updated = content.replace(/"copyEngine"\s*:\s*false/g, '"copyEngine": true');
  if (updated === content) {
    return false;
  }

  fs.writeFileSync(generatedClientEntry, updated);
  return true;
}

function copyPrismaEngineBinaries(rootDir = process.cwd()) {
  const sourceDir = path.join(rootDir, 'node_modules', 'prisma');
  const targetDir = path.join(rootDir, 'node_modules', '@prisma', 'client');

  if (!fs.existsSync(sourceDir) || !fs.existsSync(targetDir)) {
    return [];
  }

  const candidates = fs
    .readdirSync(sourceDir)
    .filter((file) => {
      return (
        file.startsWith('query_engine') ||
        file.startsWith('libquery_engine') ||
        file.startsWith('query-engine')
      );
    })
    .map((file) => path.join(sourceDir, file));

  const copied = [];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    const targetPath = path.join(targetDir, path.basename(candidate));
    try {
      fs.copyFileSync(candidate, targetPath);
    } catch (error) {
      const code = error && error.code;
      const isTransientLock = code === 'EBUSY' || code === 'EPERM' || code === 'EACCES';
      if (!isTransientLock || !fs.existsSync(targetPath)) {
        throw error;
      }
    }
    copied.push(path.basename(candidate));
  }

  return copied;
}

function runPrismaGenerate() {
  const command = process.execPath;
  const prismaCliEntry = require.resolve('prisma/build/index.js');
  const generatedClientDir = path.join(process.cwd(), 'node_modules', '@prisma', 'client');

  removePrismaEngineArtifacts();

  const result = spawnSync(command, [prismaCliEntry, 'generate'], {
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
    cwd: process.cwd(),
    env: {
      ...process.env,
      PRISMA_GENERATE_SKIP_AUTOINSTALL: 'true',
    },
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  if (!fs.existsSync(generatedClientDir)) {
    throw new Error(`Expected generated Prisma client at ${generatedClientDir}`);
  }

  removePrismaEngineArtifacts();
  ensurePrismaClientUsesLocalEngine(process.cwd());
  copyPrismaEngineBinaries(process.cwd());
}

if (require.main === module) {
  runPrismaGenerate();
}

module.exports = {
  copyPrismaEngineBinaries,
  ensurePrismaClientUsesLocalEngine,
  removePrismaEngineArtifacts,
  runPrismaGenerate
};
