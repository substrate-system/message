# request

Create and verify signed messages.

## install

```
npm i @ssc-hermes/request
```

## example

### create a request
```js
import { test } from 'tapzero'
import { create } from '@ssc-hermes/request'

let req
test('create request', async t => {
    // program is from `odd.program({...})`
    const { keystore } = program.components.crypto

    req = await create(keystore, { type: 'test', value: 'wooo' })
    t.ok(req, 'request was created')
    t.equal(typeof req.signature, 'string', 'should have a signature')
    t.equal(req.type, 'test', 'should have the properties we passed in')
})
```

### verify a request
```js
import { test } from 'tapzero'
import { writeKeyToDid } from '@ssc-hermes/util'
import { verify } from '@ssc-hermes/request'

test('verify a message', async t => {
    const authorDID = await writeKeyToDid(program.components.crypto)
    // pass in the author's DID, and the request itself
    const isOk = await verify(authorDID, req)
    t.equal(isOk, true, 'should return true for a valid message')
})
```