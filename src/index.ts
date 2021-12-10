import { Readable } from 'stream';

export function loopStream(
  stream: Readable,
  iter: (
    chunk: Buffer
  ) => { action: 'continue' } | { action: 'end'; unconsumedData?: Buffer }
): Promise<void> {
  return new Promise((res, rej) => {
    const onReadable = () => {
      let chunk;

      while ((chunk = stream.read()) !== null) {
        const result = iter(chunk);

        if (result.action === 'continue') {
          continue;
        }

        stream.off('error', rej);
        stream.off('readable', onReadable);
        if (result.unconsumedData?.length) {
          stream.unshift(result.unconsumedData);
        }

        res();
        break;
      }
    };

    stream.on('error', rej);

    // run it in case readable was already triggered
    onReadable();
    stream.on('readable', onReadable);

    // @TODO handle case when stream is closed at the beginning
  });
}
