const crypto = require('crypto')
const secp256k1 = require('secp256k1-native')

const signCtx = secp256k1.secp256k1_context_create(secp256k1.secp256k1_context_SIGN)
const verifyCtx = secp256k1.secp256k1_context_create(secp256k1.secp256k1_context_VERIFY)

let seckey
do {
  seckey = crypto.randomBytes(32)
} while (!secp256k1.secp256k1_ec_seckey_verify(signCtx, seckey))

const pubkey = Buffer.alloc(64)
secp256k1.secp256k1_ec_pubkey_create(signCtx, pubkey, seckey)

const msg = Buffer.from('Hello, World!')
const msg32 = crypto.createHash('sha256').update(msg).digest()
console.log("\nmsg32:", msg32.toString("hex"));

const sig = Buffer.alloc(64)
secp256k1.secp256k1_ecdsa_sign(signCtx, sig, msg32, seckey)

// Normal

console.log("\nsig:", sig.toString("hex"));

const result = secp256k1.secp256k1_ecdsa_verify(verifyCtx, sig, msg32, pubkey) ? 'valid' : 'invalid'
console.log('\nsignature is', result)


// Recoverable

const sigout = Buffer.alloc(65)
secp256k1.secp256k1_ecdsa_sign_recoverable(signCtx, sigout, msg32, seckey)
console.log("\nsigout:", sigout.toString("hex"));

const resultRec = secp256k1.secp256k1_ecdsa_recover(verifyCtx, pubkey, sigout, msg32)
console.log('\nsignature is', resultRec)




