#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runCapture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    ...options,
  });

  if (result.error || result.status !== 0) {
    return null;
  }

  return (result.stdout || '').trim();
}

function readArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return fallback;
  }

  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`);
  }

  return value;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function getDefaultTag() {
  const shortSha = runCapture('git', ['rev-parse', '--short', 'HEAD']);
  if (shortSha) {
    return `git-${shortSha}`;
  }

  return `build-${Date.now()}`;
}

function getVersionTag() {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJsonRaw = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonRaw);
    const version = typeof packageJson.version === 'string' ? packageJson.version.trim() : '';
    if (!version) {
      return null;
    }
    return `v${version}`;
  } catch {
    return null;
  }
}

function parseBoolean(input, fallback = false) {
  if (input === undefined) {
    return fallback;
  }

  return input === 'true';
}

function main() {
  const sourceImage = readArg('--source', process.env.IMAGE_SOURCE || 'dissertation-backend:local');
  const imageRepo = readArg('--repo', process.env.IMAGE_REPO || '').trim();
  const imageTag = readArg('--tag', process.env.IMAGE_TAG || getDefaultTag()).trim();
  const aliasTag = readArg('--alias', process.env.IMAGE_ALIAS || '').trim();
  const includeVersionTag = hasFlag('--with-version') || parseBoolean(process.env.IMAGE_WITH_VERSION, false);
  const shouldPush = hasFlag('--push') || process.env.IMAGE_PUSH === 'true';

  if (!imageRepo) {
    throw new Error(
      'IMAGE_REPO is required. Set IMAGE_REPO or pass --repo (example: ghcr.io/acme/dissertation-backend).'
    );
  }

  const refsToPublish = [`${imageRepo}:${imageTag}`];

  if (includeVersionTag) {
    const versionTag = getVersionTag();
    if (!versionTag) {
      throw new Error('Unable to determine version tag from package.json.');
    }
    refsToPublish.push(`${imageRepo}:${versionTag}`);
  }

  if (aliasTag) {
    refsToPublish.push(`${imageRepo}:${aliasTag}`);
  }

  const uniqueRefsToPublish = Array.from(new Set(refsToPublish));

  for (const targetRef of uniqueRefsToPublish) {
    run('docker', ['tag', sourceImage, targetRef]);
    process.stdout.write(`Tagged ${sourceImage} -> ${targetRef}\n`);
  }

  if (!shouldPush) {
    process.stdout.write('Tagging complete. Skipped push (set IMAGE_PUSH=true or pass --push to publish).\n');
    return;
  }

  for (const targetRef of uniqueRefsToPublish) {
    run('docker', ['push', targetRef]);
    process.stdout.write(`Pushed ${targetRef}\n`);
  }

  process.stdout.write('Publish complete.\n');
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
