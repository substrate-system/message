import { test } from '@substrate-system/tapzero'
import { RsaKeys } from '@substrate-system/keys/rsa'
import { EccKeys } from '@substrate-system/keys/ecc'
import { publicKeyToDid } from '@substrate-system/keys/crypto'
import * as msg from '../src/index.js'
import { type SignedMessage } from '../src/index.js'

let alicesKeys:RsaKeys
let eccKeys:EccKeys

test('setup', async t => {
    alicesKeys = await RsaKeys.create()
    eccKeys = await EccKeys.create()
    t.ok(alicesKeys, 'create keys')
    t.ok(eccKeys, 'create ecc keys')
})

test('create a message with Ed25519 keys', async t => {
    const newMsg = await msg.create(eccKeys.writeKey, { abc: 123 })
    t.ok(newMsg, 'should return something')
    t.ok(newMsg.author.includes('did:key:'), 'should include a DID string')
    t.equal(newMsg.abc, 123, 'should keep the properties we passed in')
})

test('verify an Ed25519 message', async t => {
    const newMsg = await msg.create(eccKeys.writeKey, { abc: 123 })
    t.equal(await msg.verify(newMsg), true, 'should verify')
})

let req:SignedMessage<{ hello:string }>

test('create a message', async t => {
    req = await msg.create(alicesKeys.writeKey, { hello: 'world' })

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

//
// Unicode. The signing and verification paths must agree about how
// text becomes bytes.
//

const UNICODE = {
    accented: 'héllo wörld',
    nonLatin: 'こんにちは 안녕하세요 привет مرحبا',
    astral: 'a \u{1F600} \u{1D11E} b',
    mixed: 'café \u{1F1FA}\u{1F1F8} 日本'
}

for (const [name, value] of Object.entries(UNICODE)) {
    test(`RSA round trip with ${name} text`, async t => {
        const m = await msg.create(alicesKeys.writeKey, { text: value })
        t.equal(m.text, value, 'should keep the text')
        t.equal(await msg.verify(m), true, 'should verify')
    })

    test(`Ed25519 round trip with ${name} text`, async t => {
        const m = await msg.create(eccKeys.writeKey, { text: value })
        t.equal(await msg.verify(m), true, 'should verify')
    })
}

test('unicode in keys, not just values', async t => {
    const m = await msg.create(alicesKeys.writeKey, {
        クエリ: 'ok',
        naïve: 1
    })
    t.equal(await msg.verify(m), true, 'should verify')
})

test('unicode message with tampered text does not verify', async t => {
    const m = await msg.create(alicesKeys.writeKey, { text: 'héllo' })
    const tampered = { ...m, text: 'hèllo' }
    t.equal(await msg.verify(tampered), false, 'should not verify')
})

//
// Reserved keys.
//

test('create rejects a `signature` key', async t => {
    try {
        // @ts-expect-error -- reserved key
        await msg.create(alicesKeys.writeKey, { signature: 'metadata' })
        t.fail('should throw')
    } catch (err) {
        t.ok(err instanceof TypeError, 'should throw a TypeError')
    }
})

test('create rejects an `author` key', async t => {
    try {
        // @ts-expect-error -- reserved key
        await msg.create(alicesKeys.writeKey, { author: 'me' })
        t.fail('should throw')
    } catch (err) {
        t.ok(err instanceof TypeError, 'should throw a TypeError')
    }
})

test('create rejects a non-object', async t => {
    for (const bad of [null, 'a string', 42, ['a', 'b']]) {
        try {
            await msg.create(alicesKeys.writeKey, bad as never)
            t.fail(`should throw for ${JSON.stringify(bad)}`)
        } catch (err) {
            t.ok(err instanceof TypeError, 'should throw a TypeError')
        }
    }
})

//
// `__proto__`. A JSON `__proto__` key is an ordinary own property, and
// must be covered by the signature like any other.
//

const protoPayload = () => JSON.parse('{"__proto__":"evil","a":1}')

test('a message created with a `__proto__` key verifies', async t => {
    const m = await msg.create(alicesKeys.writeKey, protoPayload())
    t.ok(
        Object.prototype.hasOwnProperty.call(m, '__proto__'),
        'should keep `__proto__` as an own property'
    )
    t.equal(await msg.verify(m), true, 'should verify')
})

test('adding a `__proto__` key invalidates a message', async t => {
    const good = await msg.create(alicesKeys.writeKey, { a: 1 })
    const tampered = JSON.parse(
        JSON.stringify(good).replace('{', '{"__proto__":"evil",')
    )

    t.ok(
        Object.prototype.hasOwnProperty.call(tampered, '__proto__'),
        'the tampered message has an own `__proto__` property'
    )
    t.equal(await msg.verify(tampered), false, 'should not verify')
})

test('changing a `__proto__` value invalidates a message', async t => {
    const m = await msg.create(alicesKeys.writeKey, protoPayload())
    const tampered = JSON.parse(
        JSON.stringify(m).replace('"evil"', '"eviler"')
    )
    t.equal(await msg.verify(tampered), false, 'should not verify')
})

//
// Malformed input resolves false rather than rejecting.
//

test('verify resolves false for a malformed DID', async t => {
    const m = await msg.create(alicesKeys.writeKey, { a: 1 })
    for (const author of ['', 'nope', 'did:key:', 'did:key:z!!!']) {
        const result = await msg.verify({ ...m, author } as never)
        t.equal(result, false, `should be false for author "${author}"`)
    }
})

test('verify resolves false for a malformed signature', async t => {
    const m = await msg.create(alicesKeys.writeKey, { a: 1 })
    for (const signature of ['', '!!!not base64!!!', 'AAAA']) {
        const result = await msg.verify({ ...m, signature })
        t.equal(result, false, 'should be false for a bad signature')
    }
})

test('verify resolves false for a missing field', async t => {
    const m = await msg.create(alicesKeys.writeKey, { a: 1 })

    const { signature: _sig, ...noSig } = m
    t.equal(await msg.verify(noSig as never), false, 'no signature')

    const { author: _author, ...noAuthor } = m
    t.equal(await msg.verify(noAuthor as never), false, 'no author')
})

test('verify resolves false for a non-object', async t => {
    for (const bad of [null, undefined, 'a string', 42, ['a']]) {
        const result = await msg.verify(bad as never)
        t.equal(result, false, `should be false for ${typeof bad}`)
    }
})

test('verify resolves false for non-string fields', async t => {
    const m = await msg.create(alicesKeys.writeKey, { a: 1 })
    t.equal(await msg.verify({ ...m, signature: 1 } as never), false,
        'numeric signature')
    t.equal(await msg.verify({ ...m, author: {} } as never), false,
        'object author')
})

test('verify resolves false for content it cannot canonicalize',
    async t => {
        const m = await msg.create(alicesKeys.writeKey, { a: 1 })

        const cyclic:Record<string, unknown> = { ...m }
        cyclic.self = cyclic
        t.equal(await msg.verify(cyclic as never), false, 'cyclic')

        t.equal(await msg.verify({ ...m, a: NaN } as never), false, 'NaN')
    }
)

//
// Wrong key.
//

test('a message does not verify against another author', async t => {
    const bob = await RsaKeys.create()
    const bobsDid = await publicKeyToDid(bob.writeKey.publicKey)

    const m = await msg.create(alicesKeys.writeKey, { a: 1 })
    const result = await msg.verify({ ...m, author: bobsDid })
    t.equal(result, false, 'should not verify with the wrong author')
})

test('an Ed25519 signature does not verify against an RSA DID',
    async t => {
        const eccMsg = await msg.create(eccKeys.writeKey, { a: 1 })
        const alicesDid = await publicKeyToDid(alicesKeys.writeKey.publicKey)
        const result = await msg.verify({ ...eccMsg, author: alicesDid })
        t.equal(result, false, 'should not verify')
    }
)

//
// Nesting and serialization.
//

test('nested content round trips', async t => {
    const m = await msg.create(alicesKeys.writeKey, {
        nested: { b: [1, 2, { c: 'déjà' }], d: null },
        top: true
    })
    t.equal(await msg.verify(m), true, 'should verify')
})

test('a nested mutation invalidates a message', async t => {
    const m = await msg.create(alicesKeys.writeKey, {
        nested: { b: [1, 2, 3] }
    })
    const tampered = JSON.parse(JSON.stringify(m))
    tampered.nested.b[2] = 4
    t.equal(await msg.verify(tampered), false, 'should not verify')
})

test('a message survives a JSON round trip', async t => {
    const m = await msg.create(alicesKeys.writeKey, {
        text: 'héllo \u{1F600}',
        nested: { a: [1, null, false] }
    })
    const parsed = JSON.parse(JSON.stringify(m))
    t.equal(await msg.verify(parsed), true, 'should still verify')
})

test('key order does not matter', async t => {
    const m = await msg.create(alicesKeys.writeKey, { a: 1, b: 2, c: 3 })
    const reordered:Record<string, unknown> = {}
    for (const key of Object.keys(m).sort().reverse()) {
        reordered[key] = m[key]
    }
    t.equal(await msg.verify(reordered as never), true, 'should verify')
})
