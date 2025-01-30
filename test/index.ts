import { test } from '@substrate-system/tapzero'
import { create } from '@bicycle-codes/crypto-util/webcrypto/rsa'
import { KeyUse } from '@bicycle-codes/crypto-util'
import * as msg from '../dist/index.js'
import { type SignedMessage } from '../dist/index.js'

let alicesKeys:CryptoKeyPair

test('setup', async t => {
    alicesKeys = await create(KeyUse.Sign)
    t.ok(alicesKeys, 'create keys')
})

let req:SignedMessage<{ hello: 'world' }>

test('create a message', async t => {
    req = await msg.create(alicesKeys, { hello: 'world' })

    t.ok(req, 'request was created')
    t.equal(typeof req.signature, 'string', 'should have a signature')
    t.ok(req.author.includes('did:key:'), 'should have an author field')
    t.equal(req.hello, 'world', 'should have the properties we passed in')
})

test('verify a message', async t => {
    const isOk = await msg.verify(req)
    t.equal(isOk, true, 'should return true for a valid message')
})

test('verify an invalid message', async t => {
    const isOk = await msg.verify(Object.assign({ foo: 'bar' }, req))
    t.equal(isOk, false, 'should return false for an invalid message')
})
