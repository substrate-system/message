/**
 * Check that the README examples import things that exist.
 *
 * The examples are prose, not a test suite, so this does not run them.
 * It does resolve every `import` in every fenced code block, and check
 * that each named binding is really exported -- which is the way these
 * examples have drifted before.
 *
 * Run with `npm run test:readme`, which builds first.
 */
import { test } from '@substrate-system/tapzero'
import { readFileSync } from 'node:fs'

// the package's own name, resolved against the build rather than npm
const SELF = '@substrate-system/message'
const SELF_ENTRY = '../dist/index.js'
const SELF_TYPES = './dist/index.d.ts'

const readme = readFileSync('./README.md', 'utf8')

/**
 * @returns {{ specifier:string, names:string[], types:string[] }[]}
 */
function readImports (markdown) {
    const blocks = [...markdown.matchAll(/```(?:js|ts)\n([\s\S]*?)```/g)]
        .map(match => match[1])

    const found = []
    for (const block of blocks) {
        const statements = block.matchAll(
            /import\s+(type\s+)?\{([^}]+)\}\s+from\s+'([^']+)'/g
        )

        for (const [, typeOnly, bindings, specifier] of statements) {
            const names = []
            const types = []

            for (const raw of bindings.split(',')) {
                const binding = raw.trim()
                if (!binding) continue
                const name = binding.replace(/^type\s+/, '').split(/\s+as\s+/)[0]
                if (typeOnly || binding.startsWith('type ')) {
                    types.push(name)
                } else {
                    names.push(name)
                }
            }

            found.push({ specifier, names, types })
        }
    }

    return found
}

const imports = readImports(readme)

test('the README has examples to check', async t => {
    t.ok(imports.length > 0, 'should find imports in the README')
})

test('every README value import resolves', async t => {
    for (const { specifier, names } of imports) {
        if (!names.length) continue

        const target = specifier === SELF ? SELF_ENTRY : specifier
        const mod = await import(target)

        for (const name of names) {
            t.ok(
                name in mod,
                `${specifier} should export ${name}`
            )
        }
    }
})

test('every README type import is declared', async t => {
    const declarations = readFileSync(SELF_TYPES, 'utf8')

    for (const { specifier, types } of imports) {
        if (!types.length) continue
        t.equal(specifier, SELF, 'types should come from this package')

        for (const name of types) {
            t.ok(
                declarations.includes(`type ${name}`),
                `${specifier} should declare ${name}`
            )
        }
    }
})
