import * as odd from '@oddjs/odd'
import { components } from '@ssc-hermes/node-components'
import { test } from 'tapzero'
import { create, verify } from '@ssc-hermes/request'

let program

test('setup', async t => {
    program = await odd.assemble({
        namespace: { creator: 'test', name: 'testing' },
        debug: false
    }, components)

    t.ok(program, 'create a program')
})

let req
test('create request', async t => {
    const { crypto } = program.components
    // const { keystore } = program.components.crypto

    // req = await create(keystore, { type: 'test', value: 'wooo' })
    req = await create(crypto, { type: 'test', value: 'wooo' })
    t.ok(req, 'request was created')
    t.equal(typeof req.signature, 'string', 'should have a signature')
    t.ok(req.author.includes, 'did:key:', 'should have an author field')
    t.equal(req.type, 'test', 'should have the properties we passed in')
})

test('verify a message', async t => {
    const isOk = await verify(req)
    t.equal(isOk, true, 'should return true for a valid message')
})

test('verify an invalid message', async t => {
    const isOk = await verify(Object.assign({ foo: 'bar' }, req))
    t.equal(isOk, false, 'should return false for an invalid message')
})
