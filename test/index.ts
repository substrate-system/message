import { test } from '@bicycle-codes/tapzero'
import { create } from '@bicycle-codes/crypto-util/webcrypto/rsa'
import * as msg from '../dist/index.js'
import { SignedMessage } from '../dist/index.js'
import { KeyUse } from '@bicycle-codes/crypto-util'

let alicesKeys:CryptoKeyPair

test('setup', async t => {
    alicesKeys = await create(KeyUse.Sign)
    t.ok(alicesKeys, 'create keys')
})

let req:SignedMessage<{ hello: 'world' }>

test('create request', async t => {
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
