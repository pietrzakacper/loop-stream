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
        console.log('Hi!');
        break;
    }
}

process.stdin.on('data', (chunk) => {
  // This will never run :(
});
```
instead you could just use `loopStream`:

```ts
await loopStream(process.stdin, (chunk) => {
      if(chunk.toString() === 'Hello\n') {
          console.log('Hi!');
          return { action: 'break' };
      }
  
      return { action: 'continue' };
  })

process.stdin.on('data', (chunk) => {
  // This will work as expected!
});
```

## More examples

### Parsing HTTP headers
There are some more use case's for this little function.
Let's suppose you want to parse incoming HTTP headers and then read the body using different listeners.

```ts
async function readHttpHeaders(stream: Readable): Promise<Record<string, string>> {
    /* Assuming the structure of the request is
        Header1: Value1\r\n
        Header2: Value2\r\n
        \r\n
        [Body]
    */
    return loopStream(stream, '', (chunk, acc) => {
        acc += chunk;

        const headEndSeqIndex = acc.indexOf("\r\n\r\n");

        // if we didn't get to the end of headers section of HTTP request, just continue reading the headers
        if (headEndSeqIndex === -1) {
            return { action: "continue", acc };
        }

        const rawHeaders = acc.slice(0, headEndSeqIndex);
        // when we know we already got to the end of headers we have to make sure we didn't read a part of HTTP body
        const bodyBeginning = acc.slice(headEndSeqIndex + "\r\n\r\n".length);

        // if so, we want to return it as 'unconsumedData' so it can be unshifted into the original stream
        return {
            action: "break",
            acc: rawHeaders,
            unconsumedData: bodyBeginning
        };
    });
}

// Consume just the headers part of the HTTP request
const headers = await readHttpHeaders(request);

// and then we just read the remaining stream to get the body
let body = '';
for await (const bodyChunk of request)
  body += bodyChunk;
```

## Install

```bash
npm install loop-stream
```

## Reference

### loopStream(stream, iter)
* `stream` - Readable stream
* `iter` - [IterateWithoutState](#IterateWithoutState)
* Returns - Promise<void> that resolves either when `{ action: 'break' }` is returned or when the stream has ended.

### IterateWithoutState
* chunk - Chunk of stream data obtained using `stream.read()`
* Returns - `{ action: 'continue'; }` or `{ action: 'break'; unconsumedData?: any; };`

Consumes chunk of data.

Example:

```ts
await loopStream(process.stdin, (chunk) => {
    if(chunk === 'Hi\n') {
        console.log('Hello');
        return { action: 'break' };
    }

    return { action: 'continue' };
});
```

### loopStream(stream, acc, iter)
* `stream` - Readable stream
* `initialAcc` - initial value of the accumulator
* `iter` - [IterateWithState](#IterateWithState)
* Returns - Promise<Accumulator> that resolves either when `{ action: 'break' }` is returned or when the stream has ended.

It's a bit like `arr.reduce()` for streams. You can accumulate chunks from streams into some value the will be later returned from loopStream.

### IterateWithState
* chunk - Chunk of stream data obtained using `stream.read()`
* acc - Accumulator returned from the previous iteration. In the first iteration it's `initialAcc`.
* Returns - `{ action: 'continue'; acc: Accumulator; }` or `{ action: 'break'; unconsumedData?: any; acc: Accumulator; };`

Consumes chunk of data and accumulates processed stream.


Example:

```ts
const stream = new PassThrough({ objectMode: true });
[2, 1, 3, -1, 3].forEach(num => stream.write(num));

const sum = await loopStream(stream, 0, (chunk, acc: number) => {
    if(chunk === -1) {
        return { action: 'break', acc };
    }
    
    return { action: 'continue', acc: acc + chunk };
});

// sum: 6
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
