import { verify as utilVerify, sign, toString, writeKeyToDid } from '@ssc-hermes/util'
import stringify from 'json-stable-stringify'
import { Crypto } from '@oddjs/odd'

interface SignedRequest {
    signature:string,
    author:string,
    [key: string]:string|number  // serializable values
}

export async function create (crypto:Crypto.Implementation, obj:object):
Promise<SignedRequest> {
    const author = await writeKeyToDid(crypto)
    const content = { ...obj, author }
    const sig = toString(await sign(crypto.keystore, stringify(content)))
    return { ...content, signature: sig }
}

export async function verify (msg:SignedRequest) {
    const sig = msg.signature
    const authorDID = msg.author
    const msgContent:Partial<SignedRequest> = Object.assign({}, msg)
    delete msgContent.signature
    return (await utilVerify(authorDID, sig, stringify(msgContent)))
}
