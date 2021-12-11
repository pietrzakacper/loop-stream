import { PassThrough } from 'stream';
import { loopStream } from '../src';

describe('Use case: Sum numbers', () => {
  it('allows to accumulate sum of incoming numbers', async () => {
    const stream = new PassThrough({ objectMode: true });
    [2, 1, 3, -1, 3].forEach(num => stream.write(num));

    const sum = await loopStream(stream, 0, (chunk: number, acc: number) => {
      if (chunk === -1) {
        return { action: 'break', acc };
      }

      return { action: 'continue', acc: acc + chunk };
    });

    expect(sum).toEqual(6);
  });
});
