/**
 * Type level tests for the public declarations.
 *
 * Nothing here runs. It is checked by `npm run typecheck`, which is
 * the point -- these assert what the compiler lets callers do.
 */
import { create, verify } from '../src/index.js'
import type { DID, SignedMessage, MessageInput } from '../src/index.js'

type Expect<T extends true> = T

export type _AuthorIsADid = Expect<
    SignedMessage<{ a:number }>['author'] extends DID ? true : false
>

export type _SignatureIsAString = Expect<
    SignedMessage<{ a:number }>['signature'] extends string ? true : false
>

export type _InputPropsAreKept = Expect<
    SignedMessage<{ hello:string }>['hello'] extends string ? true : false
>

export type _ReservedKeysAreExcluded = Expect<
    { signature:string } extends MessageInput ? false : true
>

declare const keys:CryptoKeyPair

export async function _acceptedInput ():Promise<void> {
    const m = await create(keys, { hello: 'world', n: 1 })

    const _hello:string = m.hello
    const _n:number = m.n
    const _sig:string = m.signature
    const _author:DID = m.author
    const _isOk:boolean = await verify(m)

    // a message read off the wire is `any` shaped, and still verifies
    const _fromWire:boolean = await verify(JSON.parse('{}'))
}

export async function _rejectedInput ():Promise<void> {
    // @ts-expect-error `signature` is a reserved key
    await create(keys, { signature: 'metadata' })

    // @ts-expect-error `author` is a reserved key
    await create(keys, { author: 'did:key:zABC' })

    // @ts-expect-error a message must not be empty
    await create(keys, {})
}
