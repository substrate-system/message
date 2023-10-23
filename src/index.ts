import {
    verify as utilVerify,
    sign,
    toString,
    writeKeyToDid
} from '@ssc-half-light/util'
import stringify from 'json-canon'
import { Crypto } from '@oddjs/odd'

export type SignedRequest<T> = ({
    [K in keyof T]:T[K];
} & {
    signature:string;
    author:string;
})

type NotEmpty<T> = keyof T extends never ? never : T

export async function create<T> (
    crypto:Crypto.Implementation,
    obj:NotEmpty<T>
): Promise<SignedRequest<T>> {
    const author = await writeKeyToDid(crypto)
    const content = { ...obj, author }
    const sig = toString(await sign(crypto.keystore, stringify(content)))
    return { ...content, signature: sig }
}

type Request = { [key:string]:any } & {
    signature:string,
    author:`did:key:z${string}`
}

export async function verify (msg:SignedRequest<Request>):Promise<boolean> {
    const sig = msg.signature
    const authorDID = msg.author
    const msgContent:Partial<SignedRequest<Request>> = Object.assign({}, msg)
    delete msgContent.signature
    return (await utilVerify(authorDID, sig, stringify(msgContent)))
}
