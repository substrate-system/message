import { type Keys, verify as keysVerify } from '@substrate-system/keys'
import { toString } from 'uint8arrays'
import stringify from 'json-canon'

export type SignedMessage<T> = ({
    [K in keyof T]:T[K];
} & {
    signature:string;
    author:`did:key:z${string}`;
})

type NotEmpty<T> = keyof T extends never ? never : T

export async function create<T> (
    keys:Keys,
    obj:NotEmpty<T>
):Promise<SignedMessage<T>> {
    const authorDid = await keys.DID
    const content = { ...obj, author: authorDid }
    const sig = toString(await keys.sign(stringify(content)), 'base64pad')

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
    return (await keysVerify(stringify(msgContent), sig, authorDID))
}
