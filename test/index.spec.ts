import { PassThrough } from 'stream';
import { loopStream } from '../src';

describe('loopStream()', () => {
  it('allows to save chunk through closure', async () => {
    const inStream = new PassThrough({ objectMode: true });

    const chunkToWrite = '1000 years ago when a king';
    inStream.write(chunkToWrite);

    let savedChunk: Buffer | undefined;

    // continue after first iteration and then end with the first chunk
    await loopStream(inStream, chunk => {
      savedChunk = chunk;
      return { action: 'break' };
    });

    expect(savedChunk).toEqual(chunkToWrite);
  });

  it('allows to save chunk through internal state', async () => {
    const inStream = new PassThrough({ objectMode: true });

    const chunkToWrite = '1000 years ago when a king';
    inStream.write(chunkToWrite);
    inStream.write('Other chunk');

    // continue after first iteration and then end with the first chunk
    const result = await loopStream(inStream, '', chunk => {
      return { action: 'break', acc: chunk };
    });

    expect(result).toEqual(chunkToWrite);
  });

  it('accumulates chunks from part of a stream', async () => {
    const inStream = new PassThrough({ objectMode: true });

    const resultPromised = loopStream(
      inStream,
      [] as { name: string }[],
      (chunk, acc) => {
        acc.push(chunk);

        return acc.length === 2
          ? { action: 'break', acc }
          : { action: 'continue', acc };
      }
    );

    inStream.write({ name: 'Jakob' });
    inStream.write({ name: 'Angel' });
    inStream.write({ name: 'Gabriel' });

    const result = await resultPromised;

    expect(result).toEqual([{ name: 'Jakob' }, { name: 'Angel' }]);
  });

  it('accumulates chunks to the end of stream', async () => {
    const inStream = new PassThrough({ objectMode: true });

    const resultPromised = loopStream(
      inStream,
      [] as { name: string }[],
      (chunk, acc) => {
        acc.push(chunk);

        return { action: 'continue', acc };
      }
    );

    inStream.write({ name: 'Jakob' });
    inStream.write({ name: 'Angel' });
    inStream.end();

    const result = await resultPromised;

    expect(result).toEqual([{ name: 'Jakob' }, { name: 'Angel' }]);
  });

  it('rejects when stream emits error', async () => {
    const stream = new PassThrough();

    const resultPromised = loopStream(stream, () => {
      return { action: 'continue' };
    });

    stream.write('Hello');
    stream.emit('error', new Error('Oopsie!'));

    await expect(resultPromised).rejects.toEqual(new Error('Oopsie!'));
  });

  it('rejects when callback throws error', async () => {
    const stream = new PassThrough();

    const resultPromised = loopStream(stream, () => {
      throw new Error('Something went wrong');
    });

    stream.write('Hello');

    await expect(resultPromised).rejects.toEqual(
      new Error('Something went wrong')
    );
  });

  it('resolves when stream is destroyed', async () => {
    const stream = new PassThrough();
    stream.destroy();

    const resultPromised = loopStream(stream, () => {
      return { action: 'continue' };
    });

    await expect(resultPromised).resolves.toEqual(undefined);
  });
});
