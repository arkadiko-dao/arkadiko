  // const testnetKeys: { secretKey: string; stacksAddress: string }[] = [];
  // for (let index = 0; index < 20; index++) {
  //   const privateKey = makeRandomPrivKey();
  //   const publicKey = getPublicKey(privateKey);
  //   // enum AddressVersion {
  //   //   MainnetSingleSig = 22,
  //   //   MainnetMultiSig = 20,
  //   //   TestnetSingleSig = 26,
  //   //   TestnetMultiSig = 21,
  //   // }
  //   const addr = publicKeyToAddress(26, publicKey);
  //   testnetKeys.push({
  //     secretKey: privateKeyToString(privateKey),
  //     stacksAddress: addr
  //   });
  // }


  // const testnetKeyMap: Record<string, { address: string; secretKey: string; pubKey: string }> = Object.fromEntries(
  //   testnetKeys.map((t) => [
  //     t.stacksAddress,
  //     {
  //       address: t.stacksAddress,
  //       secretKey: t.secretKey,
  //       pubKey: publicKeyToString(pubKeyfromPrivKey(t.secretKey)),
  //     }
  //   ])
  // );
  