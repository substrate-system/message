import {
    verify as keysVerify,
    keyTypeFromDid,
    publicKeyToDid,
    rsaOperations
} from '@substrate-system/keys/crypto'
import { webcrypto } from '@substrate-system/one-webcrypto'
import { toString } from 'uint8arrays'
import stringify from 'json-canon'
import { DEFAULT_ECC_WRITE } from '@substrate-system/keys'

export type SignedMessage<T> = ({
    [K in keyof T]:T[K];
} & {
    signature:string;
    author:`did:key:z${string}`;
})

type NotEmpty<T> = keyof T extends never ? never : T

export async function create<T> (
    keys:CryptoKeyPair,
    obj:NotEmpty<T>
):Promise<SignedMessage<T>> {
    // const authorDid = await keys.DID
    const authorDid = await publicKeyToDid(keys.publicKey)
    const keyType = keyTypeFromDid(authorDid)

    // now sign the message
    const content = { ...obj, author: authorDid }
    // const sig = toString(await keys.sign(stringify(content)), 'base64pad')
    let sig:string
    if (keyType === 'rsa') {
        sig = toString(
            new Uint8Array(
                await rsaOperations.sign(stringify(content), keys.privateKey)
            ),
            'base64pad'
        )
    } else {
        // is ed25519
        sig = toString(new Uint8Array(await webcrypto.subtle.sign(
            { name: DEFAULT_ECC_WRITE },
            keys.privateKey,
            stringify(content)
        )), 'base64pad')
    }

    return { ...content, signature: sig }
}

export type RequestMsg = { [key:string]:any } & {
    signature:string,
    author:`did:key:z${string}`
}

export async function verify (msg:SignedMessage<RequestMsg>):Promise<boolean> {
    const sig = msg.signature
    const authorDID = msg.author
    const msgContent:Partial<SignedMessage<RequestMsg>> = Object.assign({}, msg)
    delete msgContent.signature
    return (await keysVerify({
        message: stringify(msgContent),
        did: authorDID,
        signature: sig
    }))
}
