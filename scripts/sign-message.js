const secp256k1 = require('secp256k1')

// Private key to sign
const privateKey = Buffer.from("f7e4b0a94984a61f8d4e65fc8272dbd50c65ac8420e06c1627fae9f10c8a197f", "hex");

// Message to sign
const message = Buffer.from("de687244ff02c254e19f8738be991a4d6a510fecce8534f75d4f55b23094eecc", "hex");

// Get the public key in a compressed format
const publicKey = secp256k1.publicKeyCreate(privateKey)
console.log("Public key:", Buffer.from(publicKey).toString("hex"));

// Get signature
const signatureObject = secp256k1.ecdsaSign(message, privateKey)
console.log("Signature object:", signatureObject);

// Append recovery ID to signature
const recoveryId = new Uint8Array([signatureObject.recid]);
var mergedArray = new Uint8Array(signatureObject.signature.length + recoveryId.length);
mergedArray.set(signatureObject.signature);
mergedArray.set(recoveryId, signatureObject.signature.length);
console.log("Full signature:", Buffer.from(mergedArray).toString("hex"));

// verify the signature
const verificationResult = secp256k1.ecdsaVerify(signatureObject.signature, message, publicKey);
console.log("Verification result:", verificationResult);
