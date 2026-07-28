import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

import {
  copyPrismaEngineBinaries,
  ensurePrismaClientUsesLocalEngine,
  removePrismaEngineArtifacts,
  runPrismaGenerate,
} from '../../scripts/prisma-generate';

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}));

describe('prisma generation cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('removes stale Prisma engine artifacts before regeneration', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prisma-generate-'));
    const clientDir = path.join(tempDir, 'node_modules', '.prisma', 'client');

    fs.mkdirSync(clientDir, { recursive: true });
    fs.writeFileSync(path.join(clientDir, 'query_engine-windows.dll.node'), 'engine');
    fs.writeFileSync(path.join(clientDir, 'query_engine-windows.dll.node.tmp1234'), 'temp');
    fs.writeFileSync(path.join(clientDir, 'client.js'), 'client');

    const removed = removePrismaEngineArtifacts(tempDir);

    expect(removed).toEqual(
      expect.arrayContaining([
        'query_engine-windows.dll.node',
        'query_engine-windows.dll.node.tmp1234',
      ])
    );
    expect(fs.existsSync(path.join(clientDir, 'query_engine-windows.dll.node'))).toBe(false);
    expect(fs.existsSync(path.join(clientDir, 'query_engine-windows.dll.node.tmp1234'))).toBe(
      false
    );
    expect(fs.existsSync(path.join(clientDir, 'client.js'))).toBe(true);
  });

  it('runs the standard Prisma generation command after cleaning stale artifacts', () => {
    const mockedSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>;
    mockedSpawnSync.mockReturnValue({ status: 0 } as any);

    runPrismaGenerate();

    expect(mockedSpawnSync).toHaveBeenCalledWith(
      process.execPath,
      [expect.stringContaining('prisma'), 'generate'],
      expect.objectContaining({
        stdio: 'inherit',
        shell: false,
        cwd: process.cwd(),
      })
    );
  });

  it('forces the generated Prisma client to use the local engine path', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prisma-client-'));
    const clientEntry = path.join(tempDir, 'node_modules', '@prisma', 'client', 'index.js');
    const prismaDir = path.join(tempDir, 'node_modules', 'prisma');
    const enginePath = path.join(prismaDir, 'query-engine-windows.exe');

    fs.mkdirSync(path.dirname(clientEntry), { recursive: true });
    fs.mkdirSync(prismaDir, { recursive: true });
    fs.writeFileSync(
      clientEntry,
      ['const config = {', '  "copyEngine": false,', '};', 'module.exports = config;'].join('\n')
    );
    fs.writeFileSync(enginePath, 'engine');

    const patched = ensurePrismaClientUsesLocalEngine(tempDir);
    const copied = copyPrismaEngineBinaries(tempDir);

    expect(patched).toBe(true);
    expect(fs.readFileSync(clientEntry, 'utf8')).toContain('"copyEngine": true');
    expect(copied).toContain('query-engine-windows.exe');
    expect(
      fs.existsSync(
        path.join(tempDir, 'node_modules', '@prisma', 'client', 'query-engine-windows.exe')
      )
    ).toBe(true);
  });
});
