import * as odd from '@oddjs/odd'
import * as BrowserCrypto from '@oddjs/odd/components/crypto/implementation/browser'
import { test } from 'tapzero'
import { create } from '@ssc-hermes/request'

// Components
const crypto = createCryptoComponent()
const depot = createDepotComponent()
const storage = odd.storage.memory()
const config = {
    namespace: 'public-data-viewer',
    debug: true
}

const fissionComponents = await odd.compositions.fission({
    ...config,
    // @ts-ignore
    crypto,
    storage,
})

const componentsWithCustomDepot = {
    ...fissionComponents,
    depot
}

const program = await odd.assemble(
    config,
    // @ts-ignore
    componentsWithCustomDepot
)

const { keystore } = program.components.crypto

test('create request', async t => {
    const req = await create(keystore, { type: 'test', value: 'wooo' })
    console.log('**req**', req)
    t.ok(req, 'request was created')
})

function createCryptoComponent () {
    const {
        aes,
        did,
        hash,
        misc,
        rsa,
    } = BrowserCrypto

    return {
        aes,
        did,
        hash,
        misc,
        rsa,

        // We're avoiding having to implement all of this,
        // because we're not using it anyway.
        // ---
        // One way to actually implement this would be to
        // set up the keystore-idb library to use an in-memory
        // store instead of indexedDB. There's an example in
        // the Webnative tests.
        keystore: {
            clearStore: boom,
            decrypt: boom,
            exportSymmKey: boom,
            getAlgorithm: boom,
            getUcanAlgorithm: boom,
            importSymmKey: boom,
            keyExists: boom,
            publicExchangeKey: boom,
            publicWriteKey: boom,
            sign: boom,
        }
    }
}

function createDepotComponent () {
    const ipfsGateway = 'https://ipfs.runfission.com'

    function ipfs (path) {
        return fetch(`${ipfsGateway}${path}`)
            .then(r => r.arrayBuffer())
            .then(r => new Uint8Array(r))
    }

    return {
        // Get the data behind a CID
        getBlock: async cid => {
            return ipfs(`/api/v0/block/get?arg=${cid.toString()}`)
        },
        getUnixFile: async cid => {
            return ipfs(`/api/v0/cat?arg=${cid.toString()}`)
        },

        // We're avoiding having to implement all of this,
        // because we're not using it anyway.
        getUnixDirectory: boom,
        putBlock: boom,
        putChunked: boom,
        size: boom,
    }
}

function boom () {
    throw new Error('Method not implemented')
}
