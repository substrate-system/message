import { toString } from 'uint8arrays'
import {
    verify as keysVerify,
    keyTypeFromDid,
    publicKeyToDid,
    rsaOperations
} from '@substrate-system/keys/crypto'
import { webcrypto } from '@substrate-system/one-webcrypto'
// the named export, not the default -- `esbuild --format=cjs` compiles
// a default import to `__toESM(require(...), 1).default`, which under
// node's interop rules is the namespace object rather than the function
import { stringify } from '@substrate-system/json-canon'
import { ECC_WRITE_ALGORITHM } from '@substrate-system/keys/constants'

export type DID = `did:key:z${string}`

/**
 * The keys that this module adds to every message. They may not appear
 * in the object passed to `create`.
 */
export const RESERVED_KEYS = ['signature', 'author'] as const

export type ReservedKey = typeof RESERVED_KEYS[number]

/**
 * The input to `create`.
 *
 * A plain object, whose values must survive a canonical JSON round
 * trip. The reserved keys are excluded, because `create` adds them and
 * `verify` strips `signature` again -- a caller supplied `signature`
 * would be signed but not verified.
 */
export type MessageInput = {
    [key:string]:unknown;
} & {
    [K in ReservedKey]?:never;
}

export type SignedMessage<T> = ({
    [K in keyof T]:T[K];
} & {
    signature:string;
    author:DID;
})

type NotEmpty<T> = keyof T extends never ? never : T

/**
 * Canonicalize, then encode as UTF-8.
 *
 * Signing and verification must see the same bytes. The RSA path in
 * `@substrate-system/keys` truncates each UTF-16 code unit to 8 bits
 * when it is handed a string, so we always hand it bytes instead.
 */
function encodeContent (content:unknown):Uint8Array<ArrayBuffer> {
    return new TextEncoder().encode(stringify(content))
}

function assertNoReservedKeys (obj:object):void {
    for (const key of RESERVED_KEYS) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            throw new TypeError(
                `'${key}' is a reserved key; it cannot be used in a ` +
                'message'
            )
        }
    }
}

/**
 * Create a signed message.
 *
 * The returned object is the given object plus an `author` DID and a
 * `signature` over the canonical JSON of everything except the
 * signature itself.
 *
 * @param {CryptoKeyPair} keys The key pair to sign with.
 * @param {NotEmpty<T>} obj A non-empty plain object.
 * @returns {Promise<SignedMessage<T>>} The signed message.
 * @throws {TypeError} If `obj` is not a plain object, or if it uses
 * one of the reserved keys `signature` or `author`.
 */
export async function create<T extends MessageInput> (
    keys:CryptoKeyPair,
    obj:NotEmpty<T>,
):Promise<SignedMessage<T>> {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new TypeError('A message must be a plain object')
    }
    assertNoReservedKeys(obj)

    const authorDid = await publicKeyToDid(keys.publicKey)
    const keyType = keyTypeFromDid(authorDid)

    // Spread, not `Object.assign`. Spread defines own data properties,
    // so a JSON `__proto__` key is copied verbatim. `Object.assign`
    // would call the legacy prototype setter and lose it.
    const content = { ...(obj as MessageInput), author: authorDid }
    const data = encodeContent(content)

    let sig:string
    if (keyType === 'rsa') {
        sig = toString(
            new Uint8Array(
                await rsaOperations.sign(data, keys.privateKey)
            ),
            'base64pad'
        )
    } else {
        // is ed25519
        const _sig = await webcrypto.subtle.sign(
            { name: ECC_WRITE_ALGORITHM },
            keys.privateKey,
            data
        )

        sig = toString(new Uint8Array(_sig), 'base64pad')
    }

    return { ...content, signature: sig } as SignedMessage<T>
}

export type RequestMsg = { [key:string]:any } & {
    signature:string,
    author:DID
}

/**
 * Check that `msg.author` signed `msg`.
 *
 * This resolves `false` for anything that is not an authentic message,
 * including malformed input -- a missing or non string `signature` or
 * `author`, an unparseable DID, non base64 signature bytes, or content
 * that cannot be canonicalized. It does not reject.
 *
 * A `true` result means only that the `author` DID signed this exact
 * content. It says nothing about when the message was signed, or who
 * it was meant for. See the README for what this does not cover.
 *
 * @param {SignedMessage<RequestMsg>} msg The message to check.
 * @returns {Promise<boolean>} `true` iff the signature is authentic.
 */
export async function verify (
    msg:SignedMessage<RequestMsg>
):Promise<boolean> {
    try {
        if (msg === null || typeof msg !== 'object') return false
        if (Array.isArray(msg)) return false

        const sig = msg.signature
        const authorDID = msg.author
        if (typeof sig !== 'string') return false
        if (typeof authorDID !== 'string') return false

        // Object rest copies own data properties, so a JSON
        // `__proto__` key stays an own property here, exactly as it
        // was when it was signed. `Object.assign` would instead call
        // the legacy prototype setter, dropping the key from the
        // content we check, and letting anyone add one to a signed
        // message without invalidating it.
        const { signature: _signature, ...msgContent } = msg

        return (await keysVerify({
            message: encodeContent(msgContent),
            did: authorDID,
            signature: sig
        }))
    } catch (_err) {
        return false
    }
}
