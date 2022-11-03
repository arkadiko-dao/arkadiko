const crypto = require('crypto')
const secp256k1 = require('secp256k1-native')

const signCtx = secp256k1.secp256k1_context_create(secp256k1.secp256k1_context_SIGN)

let seckey
do {
  seckey = crypto.randomBytes(32)
} while (!secp256k1.secp256k1_ec_seckey_verify(signCtx, seckey))

// const msg = Buffer.from('Hello, World!')
// const msg32 = crypto.createHash('sha256').update(msg).digest()
// console.log("\nmsg32:", msg32.toString("hex"));

// Comes from "arkadiko-oracle-v1-1::get-signable-message-hash"
const msg32 = Buffer.from("78124709d15ef20a7d8d28ce25e8dbeeedb379da1d6b8e484db5651437a947b5", "hex");

// Recoverable
const sigout = Buffer.alloc(65)
secp256k1.secp256k1_ecdsa_sign_recoverable(signCtx, sigout, msg32, seckey)
console.log("\nsigout:", sigout.toString("hex"));
