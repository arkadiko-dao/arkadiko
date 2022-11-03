const crypto = require('crypto')
const secp256k1 = require('secp256k1-native')

const signCtx = secp256k1.secp256k1_context_create(secp256k1.secp256k1_context_SIGN)

// let seckey
// do {
//   seckey = crypto.randomBytes(32)
// } while (!secp256k1.secp256k1_ec_seckey_verify(signCtx, seckey))
// console.log("secKey:", seckey.toString("hex"));

let secretKey = Buffer.from("7e49e3061e04403cf9488419c3d165424df89c78eb51ec32acbe7f6b018348b3", "hex");
// let secretKey = Buffer.from("642b73572da1fad94d7b878ad2b34e797c0255d2fdac97e110769aa99a39883d", "hex");
// let secretKey = Buffer.from("f7e4b0a94984a61f8d4e65fc8272dbd50c65ac8420e06c1627fae9f10c8a197f", "hex");

const pubkey = Buffer.alloc(64)
secp256k1.secp256k1_ec_pubkey_create(signCtx, pubkey, secretKey)
console.log("pubkey:", pubkey.toString("hex"));


// const msg = Buffer.from('Hello, World!')
// const msg32 = crypto.createHash('sha256').update(msg).digest()
// console.log("\nmsg32:", msg32.toString("hex"));

// Comes from "arkadiko-oracle-v1-1::get-signable-message-hash"
// Without leading 0x
const msg32 = Buffer.from("78124709d15ef20a7d8d28ce25e8dbeeedb379da1d6b8e484db5651437a947b5", "hex");

// Recoverable
const sigout = Buffer.alloc(65)
secp256k1.secp256k1_ecdsa_sign_recoverable(signCtx, sigout, msg32, secretKey)
console.log("\nsigout:", sigout.toString("hex"));
