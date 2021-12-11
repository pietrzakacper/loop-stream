import { PassThrough } from 'stream';
import { loopStream } from '../src';

describe('Use case: Respond Hello to stdin', () => {
  const createStdio = () => {
    const stdin = new PassThrough({ objectMode: true });
    stdin.write('Yo\n');
    stdin.write('Hi\n');
    stdin.write('I want to be read too!\n');
    stdin.end();

    const stdout = new PassThrough({ objectMode: true });

    return { stdin, stdout };
  };

  it('fails to read stdin after partial consumption using async iterator', async () => {
    const { stdin, stdout } = createStdio();

    let lastReadChunk;
    for await (const chunk of stdin) {
      lastReadChunk = chunk;
      if (chunk === 'Hi\n') {
        stdout.write('Hello');
        break;
      }
    }

    expect(lastReadChunk).toBe('Hi\n');
    expect(stdout.read()).toBe('Hello');

    let chunkReadLater = null;
    for await (const chunk of stdin) {
      chunkReadLater = chunk;
    }

    // async iteration should close stdin stream
    expect(chunkReadLater).toEqual(null);
  });

  it('allows to read stdin after partial consumption using loopStream', async () => {
    const { stdin, stdout } = createStdio();

    let lastReadChunk;
    await loopStream(stdin, chunk => {
      lastReadChunk = chunk;
      if (chunk === 'Hi\n') {
        stdout.write('Hello');
        return { action: 'break' };
      }

      return { action: 'continue' };
    });

    expect(lastReadChunk).toBe('Hi\n');
    expect(stdout.read()).toBe('Hello');

    let chunkReadLater = null;
    for await (const chunk of stdin) {
      chunkReadLater = chunk;
    }

    // loopSteam shouldn't close stdin stream
    expect(chunkReadLater).toEqual('I want to be read too!\n');
  });
});
