# message

Create and verify signed messages with existing [Fission](https://github.com/oddsdk/ts-odd) libraries.

## install

```
npm i @ssc-hermes/message
```

## example

### create a message
```js
import { create } from '@ssc-hermes/message'
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
Note it will have the fields `author` and `signature` appended to it.

```js
import { test } from 'tapzero'
import { create } from '@ssc-hermes/message'

let req
test('create message', async t => {
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
import { verify } from '@ssc-hermes/message'

test('verify a message', async t => {
    // `req` is the message we created above
    const isOk = await verify(req)
    t.equal(isOk, true, 'should return true for a valid message')
})
```
