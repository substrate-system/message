import { toString } from '@bicycle-codes/crypto-util'
import {
    publicKeyToDid,
    sign,
    verifyWithDid
} from '@bicycle-codes/crypto-util/webcrypto/rsa'
import stringify from 'json-canon'

export type SignedMessage<T> = ({
    [K in keyof T]:T[K];
} & {
    signature:string;
    author:`did:key:z${string}`;
})

type NotEmpty<T> = keyof T extends never ? never : T

export async function create<T> (
    keypair:CryptoKeyPair,
    obj:NotEmpty<T>
): Promise<SignedMessage<T>> {
    const authorDid = await publicKeyToDid(keypair.publicKey)
    const content = { ...obj, author: authorDid }
    const sig = toString(
        new Uint8Array(await sign(stringify(content), keypair.privateKey))
    )

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
    return (await verifyWithDid(stringify(msgContent), sig, authorDID))
}
