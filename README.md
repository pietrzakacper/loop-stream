# loop-stream

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Code Coverage][codecov-img]][codecov-url]
[![Commitizen Friendly][commitizen-img]][commitizen-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]

> Simple function for looping your Node.js stream with C-like for loop features: `break` and `continue`

## Why use this package?
If all you want to do is consume a Node.js stream in total, then probably the easiest way is [async iteration](https://nodejs.org/api/stream.html#readablesymbolasynciterator).

However if you only want to consume it partly, there are some limitations. Using `break` will result in closing the reading stream.
Imagine the user is writing to `stdin` of your program and you want to reply to their 'Hello" with 'Hi!' and then just leave the stream for consumption to the other part of your application.
```ts
  for await (const chunk of process.stdin) {
      if(chunk.toString() === 'Hello\n') {
          console.log('Hi!')
          break;
      }
  }

```
instead you could just use `loopStream`:

```ts
await loopStream(process.stdin, (chunk) => {
      if(chunk.toString() === 'Hello\n') {
          console.log('> Hi!')
          return { action: 'break' }
      }
  
      return { action: 'continue' }
  })

process.stdin.on('data', (chunk) => {
  // This will work as expected
})

```

## More examples
There are some more use case's for this little function.
Let's suppose you want to parse incoming HTTP headers and then allow the rest of the request to be handled by some other listeners.

```ts
function readHttpHeaders(stream: Readable): Promise<Record<string, string>> {
    let readHeadersStr = "";

    /* Assuming the structure of the request is
      Header1: Value1\r\n
      Header2: Value2\r\n
      \r\n
      [Body]
    */
    await loopStream(stream, (chunk: Buffer) => {
        readHeadersStr += chunk.toString("utf-8")

        const headEndSeqIndex = readHeadersStr.indexOf("\r\n\r\n");

        // if we didn't get to the end of headers section of HTTP request, just continue reading the headers
        if (headEndSeqIndex === -1) {
            return { action: "continue" };
        }

        const rawHeaders = readHeadersStr.slice(0, headEndSeqIndex);
        // when we know we already got to the end of headers we have to make sure we didn't read a part of HTTP body
        const bodyBeginning = readHeadersStr.slice(headEndSeqIndex + "\r\n\r\n".length);

        // if so, we want to return it as 'unconsumedData' so it can be unshifted into the original stream
        return { action: "end", unconsumedData: Buffer.from(bodyBeginning, "utf8") };
    });

    // now when we only have the headers part of the request in memory we can easily parse them
    return parseHeaders(readHeadersStr)
}

const headers = await readHttpHeaders(req)

// now anyone can safely consume the body from 'req' stream
```

## Install

```bash
npm install loop-stream
```

## Usage

```ts
import { loopStream } from 'loop-stream';

let bufferedData = Buffer.from([])

await loopStream(logs, (chunk) => {
  bufferedData = Buffer.concat(bufferedData, chunk)

  // find specific string of characters in the stream e.g."Server started" in log stream 
  if(bufferedData.toString('utf-8').contains('Server started')) {
    return { action: 'break' }
  }
  
  return { action: 'continue' }
});

// Now you can keep consuming your logs stream knowing that 'Server started' appeared!
```
[build-img]:https://github.com/pietrzakacper/loop-stream/actions/workflows/release.yml/badge.svg
[build-url]:https://github.com/pietrzakacper/loop-stream/actions/workflows/release.yml
[downloads-img]:https://img.shields.io/npm/dt/loop-stream
[downloads-url]:https://www.npmtrends.com/loop-stream
[npm-img]:https://img.shields.io/npm/v/loop-stream
[npm-url]:https://www.npmjs.com/package/loop-stream
[issues-img]:https://img.shields.io/github/issues/pietrzakacper/loop-stream
[issues-url]:https://github.com/pietrzakacper/loop-stream/issues
[codecov-img]:https://codecov.io/gh/pietrzakacper/loop-stream/branch/main/graph/badge.svg
[codecov-url]:https://codecov.io/gh/pietrzakacper/loop-stream
[semantic-release-img]:https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]:https://github.com/semantic-release/semantic-release
[commitizen-img]:https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]:http://commitizen.github.io/cz-cli/
