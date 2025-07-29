# message

[![tests](https://img.shields.io/github/actions/workflow/status/substrate-system/message/nodejs.yml?style=flat-square)](https://github.com/substrate-system/message/actions/workflows/nodejs.yml)
[![types](https://img.shields.io/npm/types/msgpackr?style=flat-square)](README.md)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![install size](https://flat.badgen.net/packagephobia/install/@substrate-system/message)](https://packagephobia.com/result?p=@substrate-system/message)
[![GZip size](https://flat.badgen.net/bundlephobia/minzip/@substrate-system/messsage)](https://bundlephobia.com/package/@substrate-system/messsage)
[![license](https://img.shields.io/badge/license-Big_Time-blue?style=flat-square)](LICENSE)


Create and verify signed messages with [the webcrypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).


## Contents

<!-- toc -->

- [install](#install)
- [example](#example)
  * [create a message](#create-a-message)
  * [verify a message](#verify-a-message)

<!-- tocstop -->

## install

```sh
npm i -S @substrate-system/message
```

## example

### create a message
```js
import { Keys } from '@substrate-system/keys'
import { create } from '@substrate-system/message'

const alicesKeys = await Keys.create()
const req = await create(alicesKeys, { hello: 'world' })
```

The returned object has a format like
```js
{
    author: 'did:key:...',
    signature: '123abc',
    ...message
}
```

>
> [!NOTE]  
> The message will have the fields `author` and `signature` appended to it.
> `author` is the DID that was used to sign this message. It is read
> by `verify(message)`.
>

```js
import { test } from '@substrate-system/tapzero'
import { Keys } from '@substrate-system/keys'
import { create } from '@substrate-system/message'

let req:SignedMessage<{ hello: 'world' }>
const alicesKeys = await Keys.create()
test('create a message', async t => {
    req = await create(alicesKeys, { hello: 'world' })

    t.ok(req, 'request was created')
    t.equal(typeof req.signature, 'string', 'should have a signature')
    t.ok(req.author.includes('did:key:'), 'should have an author field')
    t.equal(req.hello, 'world', 'should have the properties we passed in')
})
```

### verify a message
```js
import { test } from '@substrate-system/tapzero'
import { verify } from '@substrate-system/message'

test('verify a message', async t => {
    // `req` is the message we created above
    const isOk = await verify(req)
    t.equal(isOk, true, 'should return true for a valid message')
})
```

