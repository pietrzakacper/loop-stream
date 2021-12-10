# loop-stream

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Code Coverage][codecov-img]][codecov-url]
[![Commitizen Friendly][commitizen-img]][commitizen-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]

> Simple function for looping your stream. Useful for extracting information from some readable stream.

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
