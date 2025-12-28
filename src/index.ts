import { toString } from 'uint8arrays'
import {
    verify as keysVerify,
    keyTypeFromDid,
    publicKeyToDid,
    rsaOperations
} from '@substrate-system/keys/crypto'
import { webcrypto } from '@substrate-system/one-webcrypto'
import stringify from '@substrate-system/json-canon'
import { ECC_WRITE_ALGORITHM } from '@substrate-system/keys/constants'

export type SignedMessage<T> = ({
    [K in keyof T]:T[K];
} & {
    signature:string;
    author:`did:key:z${string}`;
})

type NotEmpty<T> = keyof T extends never ? never : T

export async function create<T> (
    keys:CryptoKeyPair,
    obj:NotEmpty<T>,
):Promise<SignedMessage<T>> {
    const authorDid = await publicKeyToDid(keys.publicKey)
    const keyType = keyTypeFromDid(authorDid)

    // now sign the message
    const content = { ...obj, author: authorDid }
    const contentString = stringify(content)
    const encoder = new TextEncoder()
    const data = encoder.encode(contentString)

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
