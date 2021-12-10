import { PassThrough } from 'stream';
import { loopStream } from '../src';

describe('loopStream()', () => {
  it('should return data from callback', async () => {
    const callbackReturn = Symbol('Scrolls Of Wisdom');

    const inStream = new PassThrough();
    inStream.write('Hello');

    const result = await loopStream(inStream, () => ({
      action: 'end',
      data: callbackReturn,
    }));

    expect(result).toEqual(callbackReturn);
  });

  it('should return chunk', async () => {
    const inStream = new PassThrough({ objectMode: true });

    const chunkToWrite = '1000 years ago when a king';
    inStream.write(chunkToWrite);
    inStream.write('Other chunk');

    let resultPromised: Promise<string> | undefined;
    {
      let savedChunk: Buffer | undefined;

      // continue after first iteration and then end with the first chunk
      resultPromised = loopStream<string>(inStream, chunk => {
        if (!savedChunk) {
          savedChunk = chunk;
          return { action: 'continue' };
        }

        return { action: 'end', data: savedChunk.toString() };
      });
    }

    const result = await resultPromised;

    expect(result).toEqual(chunkToWrite);
  });
});
