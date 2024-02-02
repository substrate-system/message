# message

![tests](https://github.com/ssc-half-light/message/actions/workflows/nodejs.yml/badge.svg)
[![Socket Badge](https://socket.dev/api/badge/npm/package/@ssc-half-light/message)](https://socket.dev/npm/package/@ssc-half-light/message)
[![types](https://img.shields.io/npm/types/msgpackr?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![license](https://nichoth.github.io/badge/license-polyform-shield.svg)](LICENSE)


Create and verify signed messages with [Fission](https://github.com/oddsdk/ts-odd) libraries.

## install

```sh
npm i @ssc-half-light/message
```

## example

### create a message
```js
import { create } from '@ssc-half-light/message'

// const { crypto } = program.components
await create(crypto, { type: 'test', value: 'wooo' })
```

The returned object has a format like
```js
{
    author: 'did:key:...',
    signature: '123abc',
    ...message
}
```

> [!NOTE]  
> the message will have the fields `author` and `signature` appended to it. `author` is the DID that was used to sign this message. It is read by `verify(message)`.

```js
import { test } from '@nichoth/tapzero'
import { create } from '@ssc-half-light/message'

let req
test('create message', async t => {
    // program is from
    // const program = await odd.program({
    //   ...config
    // })
    const { crypto } = program.components

    req = await create(crypto, { type: 'test', value: 'wooo' })
    t.ok(req, 'message was created')
    t.equal(typeof req.signature, 'string', 'should have a signature')
    t.ok(req.author.includes, 'did:key:', 'should have an author field')
    t.equal(req.type, 'test', 'should have the properties we passed in')
})
```

### verify a message
```js
import { test } from '@nichoth/tapzero'
import { verify } from '@ssc-half-light/message'

test('verify a message', async t => {
    // `req` is the message we created above
    const isOk = await verify(req)
    t.equal(isOk, true, 'should return true for a valid message')
})
```

