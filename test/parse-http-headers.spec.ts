import { PassThrough, Readable } from 'stream';
import { loopStream } from '../src';
import { sleep } from './utils';

describe('Use case: Parsing HTTP headers', () => {
  it('allows parsing http headers using loopStream and then reading body', async () => {
    const request = new PassThrough({ encoding: 'utf-8' });

    const headersPromised = readHttpHeaders(request);

    request.write('Content-Type: application/json\r\nCo');
    await sleep(50);
    request.write('nnection: keep-alive\r\n');
    await sleep(50);
    request.write('\r\n{"name": "Jakob"}');
    await sleep(50);
    request.end();

    const headers = await headersPromised;

    let bodyStr = '';
    for await (const bodyChunk of request) bodyStr += bodyChunk;

    const body = JSON.parse(bodyStr);

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Connection: 'keep-alive',
    });

    expect(body).toEqual({
      name: 'Jakob',
    });
  });
});

async function readHttpHeaders(
  stream: Readable
): Promise<Record<string, string>> {
  /* Assuming the structure of the request is
        Header1: Value1\r\n
        Header2: Value2\r\n
        \r\n
        [Body]
    */
  const readHeadersStr = await loopStream(stream, '', (chunk, acc) => {
    acc += chunk;

    const headEndSeqIndex = acc.indexOf('\r\n\r\n');

    // if we didn't get to the end of headers section of HTTP request, just continue reading the headers
    if (headEndSeqIndex === -1) {
      return { action: 'continue', acc };
    }

    const rawHeaders = acc.slice(0, headEndSeqIndex);
    // when we know we already got to the end of headers we have to make sure we didn't read a part of HTTP body
    const bodyBeginning = acc.slice(headEndSeqIndex + '\r\n\r\n'.length);

    // if so, we want to return it as 'unconsumedData' so it can be unshifted into the original stream
    return {
      action: 'break',
      acc: rawHeaders,
      unconsumedData: bodyBeginning,
    };
  });

  // now when we only have the headers part of the request in memory we can easily parse them
  return readHeadersStr
    .split('\r\n')
    .map(headerStr => headerStr.split(': '))
    .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
}
