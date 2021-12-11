import { Readable } from 'stream';

type IterateWithoutState = (
  chunk: any
) => { action: 'continue' } | { action: 'break'; unconsumedData?: any };

type IterateWithState<Acc> = (
  chunk: any,
  acc: Acc
) =>
  | { action: 'continue'; acc: Acc }
  | { action: 'break'; acc: Acc; unconsumedData?: any };

export function loopStream(
  stream: Readable,
  iter: IterateWithoutState
): Promise<void>;

export function loopStream<Acc>(
  stream: Readable,
  initialAcc: Acc,
  iter: IterateWithState<Acc>
): Promise<Acc>;

export function loopStream<Acc>(
  stream: Readable,
  iterOrAcc: Acc | IterateWithoutState,
  iterWithState?: IterateWithState<Acc>
): Promise<Acc> | Promise<void> {
  const __keepsState = !(iterOrAcc instanceof Function);

  if (!__keepsState) {
    return loopStreamWithoutState(stream, iterOrAcc as IterateWithoutState);
  }

  return loopStreamWithState(
    stream,
    iterOrAcc as Acc,
    iterWithState as IterateWithState<Acc>
  );
  // @TODO handle case when stream is closed at the beginning
}

function loopStreamWithoutState(
  stream: Readable,
  iter: IterateWithoutState
): Promise<void> {
  return new Promise((res, rej) => {
    const cleanup = () => {
      stream.off('error', rej);
      stream.off('readable', onReadable);
      stream.off('end', onEnd);
    };

    const onEnd = () => {
      cleanup();
      res();
    };

    let chunk;

    const onReadable = () => {
      while ((chunk = stream.read()) !== null) {
        const result = iter(chunk);

        if (result.action === 'continue') {
          continue;
        }

        cleanup();

        if (typeof result.unconsumedData !== undefined) {
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
    stream.on('end', onEnd);
  });
}

function loopStreamWithState<Acc>(
  stream: Readable,
  acc: Acc,
  iter: IterateWithState<Acc>
): Promise<Acc> {
  let chunk;

  return new Promise((res, rej) => {
    const cleanup = () => {
      stream.off('error', rej);
      stream.off('readable', onReadable);
      stream.off('end', onEnd);
    };

    const onEnd = () => {
      cleanup();
      res(acc);
    };

    const onReadable = () => {
      while ((chunk = stream.read()) !== null) {
        const result = iter(chunk, acc);
        acc = result.acc;

        if (result.action === 'continue') {
          continue;
        }

        cleanup();

        if (typeof result.unconsumedData !== 'undefined') {
          stream.unshift(result.unconsumedData);
        }

        res(acc);
        break;
      }
    };

    stream.on('error', rej);

    // run it in case readable was already triggered
    onReadable();
    stream.on('readable', onReadable);
    stream.on('end', onEnd);
  });
}
