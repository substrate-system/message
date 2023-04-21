import * as odd from '@oddjs/odd'
import { components } from '@ssc-hermes/node-components'
import { test } from 'tapzero'
import { create } from '@ssc-hermes/request'

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
    const { keystore } = program.components.crypto

    req = await create(keystore, { type: 'test', value: 'wooo' })
    t.ok(req, 'request was created')
    t.equal(typeof req.signature, 'string', 'should have a signature')
    t.equal(req.type, 'test', 'should have the properties we passed in')
})
