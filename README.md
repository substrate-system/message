# request

Create and verify signed messages.

## install

```
npm i @ssc-hermes/request
```

## example

### create a request
```js
import { create } from '@ssc-hermes/request'
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
import { create } from '@ssc-hermes/request'

let req
test('create request', async t => {
    const { crypto } = program.components

    req = await create(crypto, { type: 'test', value: 'wooo' })
    t.ok(req, 'request was created')
    t.equal(typeof req.signature, 'string', 'should have a signature')
    t.ok(req.author.includes, 'did:key:', 'should have an author field')
    t.equal(req.type, 'test', 'should have the properties we passed in')
})
```

### verify a request
```js
import { test } from 'tapzero'
import { verify } from '@ssc-hermes/request'

test('verify a message', async t => {
    // `req` is the request we created above
    const isOk = await verify(req)
    t.equal(isOk, true, 'should return true for a valid message')
})
```
