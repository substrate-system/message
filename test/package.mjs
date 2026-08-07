/**
 * Check the published package, not the source.
 *
 * Exercises the built ESM and CommonJS entry points, and asserts that
 * everything `package.json` points at is actually inside the archive
 * that `npm pack` produces.
 *
 * Run with `npm run test:package`, which builds first.
 */
import { test } from '@substrate-system/tapzero'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { EccKeys } from '@substrate-system/keys/ecc'

const require = createRequire(import.meta.url)
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

test('the ESM entry point round trips', async t => {
    const esm = await import('../dist/index.js')
    const keys = await EccKeys.create()
    const m = await esm.create(keys.writeKey, { hello: 'world' })

    t.equal(typeof m.signature, 'string', 'should sign')
    t.equal(await esm.verify(m), true, 'should verify')
})

test('the CommonJS entry point round trips', async t => {
    const cjs = require('../dist/index.cjs')
    const keys = await EccKeys.create()
    const m = await cjs.create(keys.writeKey, { hello: 'world' })

    t.equal(typeof m.signature, 'string', 'should sign')
    t.equal(await cjs.verify(m), true, 'should verify')
})

test('ESM and CommonJS builds agree', async t => {
    const esm = await import('../dist/index.js')
    const cjs = require('../dist/index.cjs')
    const keys = await EccKeys.create()

    const m = await esm.create(keys.writeKey, { hello: 'wörld' })
    t.equal(await cjs.verify(m), true, 'cjs verifies an esm message')

    const m2 = await cjs.create(keys.writeKey, { hello: 'wörld' })
    t.equal(await esm.verify(m2), true, 'esm verifies a cjs message')
})

test('the archive contains every declared entry point', async t => {
    const out = execFileSync(
        'npm',
        ['pack', '--dry-run', '--json'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    )
    const packed = new Set(JSON.parse(out)[0].files.map(f => f.path))

    const declared = [
        pkg.main,
        pkg.types,
        pkg.exports['.'].types,
        pkg.exports['.'].import,
        pkg.exports['.'].require
    ]

    for (const entry of declared) {
        const relative = entry.replace(/^\.\//, '')
        t.ok(packed.has(relative), `${entry} should be published`)
    }
})

test('every runtime import is a declared dependency', async t => {
    const source = readFileSync('./src/index.ts', 'utf8')
    const imports = [...source.matchAll(/from '([^']+)'/g)]
        .map(match => match[1])
        .filter(id => !id.startsWith('.'))
        .map(id => (id.startsWith('@') ?
            id.split('/').slice(0, 2).join('/') :
            id.split('/')[0]))

    for (const id of new Set(imports)) {
        t.ok(
            pkg.dependencies[id],
            `${id} should be in "dependencies"`
        )
    }
})
