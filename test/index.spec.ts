import { PassThrough } from 'stream';
import { loopStream } from '../src';

describe('loopStream()', () => {
  it('should resolve and not throw', async () => {
    const inStream = new PassThrough();
    inStream.write('Hello');

    const result = loopStream(inStream, () => ({
      action: 'break',
    }));

    await expect(result).resolves.not.toThrow();
  });

  it('should allow to save chunk externally', async () => {
    const inStream = new PassThrough({ objectMode: true });

    const chunkToWrite = '1000 years ago when a king';
    inStream.write(chunkToWrite);
    inStream.write('Other chunk');

    let savedChunk: Buffer | undefined;

    // continue after first iteration and then end with the first chunk
    await loopStream(inStream, chunk => {
      if (!savedChunk) {
        savedChunk = chunk;
        return { action: 'continue' };
      }

      return { action: 'break' };
    });

    expect(savedChunk).toEqual(chunkToWrite);
  });
});
