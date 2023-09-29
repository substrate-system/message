# message ![tests](https://github.com/ssc-half-light/message/actions/workflows/nodejs.yml/badge.svg)

Create and verify signed messages with existing [Fission](https://github.com/oddsdk/ts-odd) libraries.

## install

```
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
**Note**
the message will have the fields `author` and `signature` appended to
it.  `author` is the DID that was used to sign this message. It is read by 
`verify(message)`.

```js
import { test } from 'tapzero'
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
import { test } from 'tapzero'
import { verify } from '@ssc-half-light/message'

test('verify a message', async t => {
    // `req` is the message we created above
    const isOk = await verify(req)
    t.equal(isOk, true, 'should return true for a valid message')
})
```

