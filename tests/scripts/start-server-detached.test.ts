import { EventEmitter } from 'events';
import { spawn } from 'child_process';

jest.mock('child_process', () => ({ spawn: jest.fn() }));

const { startServer } = require('../../scripts/start-server-detached');

describe('detached server startup', () => {
  const originalPort = process.env.PORT;
  let child: EventEmitter & {
    pid: number;
    exitCode: number | null;
    signalCode: string | null;
    kill: jest.Mock;
    disconnect: jest.Mock;
    unref: jest.Mock;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    process.env.PORT = '3001';
    child = Object.assign(new EventEmitter(), {
      pid: 123,
      exitCode: null,
      signalCode: null,
      kill: jest.fn(),
      disconnect: jest.fn(),
      unref: jest.fn(),
    });
    (spawn as jest.Mock).mockReturnValue(child);
  });

  afterEach(() => {
    if (originalPort === undefined) delete process.env.PORT;
    else process.env.PORT = originalPort;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('waits for the server to listen before releasing it', async () => {
    let resolved = false;
    const startup = startServer().then((pid: number) => {
      resolved = true;
      return pid;
    });

    await Promise.resolve();
    expect(resolved).toBe(false);
    expect(child.unref).not.toHaveBeenCalled();

    child.emit('message', { type: 'server.ready', port: 3001 });

    await expect(startup).resolves.toBe(123);
    expect(child.disconnect).toHaveBeenCalledTimes(1);
    expect(child.unref).toHaveBeenCalledTimes(1);
    expect(child.kill).not.toHaveBeenCalled();
  });

  it('fails and stops the server if it listens on a different port', async () => {
    const startup = startServer();
    child.emit('message', { type: 'server.ready', port: 3002 });

    await expect(startup).rejects.toThrow('healthcheck uses port 3001');
    expect(child.kill).toHaveBeenCalledTimes(1);
    expect(child.unref).not.toHaveBeenCalled();
  });

  it('reports an early server exit', async () => {
    const startup = startServer();
    child.exitCode = 1;
    child.emit('exit', 1, null);

    await expect(startup).rejects.toThrow('Server exited before becoming ready');
    expect(child.kill).not.toHaveBeenCalled();
  });

  it('reports a spawn error', async () => {
    const startup = startServer();
    child.emit('error', new Error('spawn failed'));

    await expect(startup).rejects.toThrow('Could not start server: spawn failed');
  });

  it('fails and stops the server if startup times out', async () => {
    const startup = startServer({ timeoutMs: 1000 });
    jest.advanceTimersByTime(1000);

    await expect(startup).rejects.toThrow('Server did not start within 1000ms');
    expect(child.kill).toHaveBeenCalledTimes(1);
    expect(child.unref).not.toHaveBeenCalled();
  });
});
