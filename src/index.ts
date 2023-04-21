import { sign, toString } from '@ssc-hermes/util'
import stringify from 'json-stable-stringify'
import { Implementation } from '@oddjs/odd/components/crypto/implementation'
type KeyStore = Implementation['keystore']

interface SignedRequest {
    signature: string,
    [key: string]: any
}

export async function create (keystore:KeyStore, obj:object):Promise<SignedRequest> {
    const sig = toString(await sign(keystore, stringify(obj)))
    const req = { signature: sig, ...obj }
    return req
}
