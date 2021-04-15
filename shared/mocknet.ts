import { pubKeyfromPrivKey, publicKeyToString } from "@stacks/transactions";

// from personal public Stacks.toml file
export const ADDR1 = "ST3EQ88S02BXXD0T5ZVT3KW947CRMQ1C6DMQY8H19";
export const ADDR2 = "ST3KCNDSWZSFZCC6BE4VA9AXWXC9KEB16FBTRK36T";
export const ADDR3 = "STB2BWB0K5XZGS3FXVTG3TKS46CQVV66NAK3YVN8";
export const ADDR4 = "STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7";
export const testnetKeys: { secretKey: string; stacksAddress: string }[] = [
  {
    secretKey:
      "539e35c740079b79f931036651ad01f76d8fe1496dbd840ba9e62c7e7b355db001",
    stacksAddress: ADDR1,
  },
  {
    secretKey:
      "075754fb099a55e351fe87c68a73951836343865cd52c78ae4c0f6f48e234f3601",
    stacksAddress: ADDR2,
  },
  {
    secretKey:
      "374b6734eaff979818c5f1367331c685459b03b1a2053310906d1408dc928a0001",
    stacksAddress: ADDR3,
  },
  {
    secretKey:
      "26f235698d02803955b7418842affbee600fc308936a7ca48bf5778d1ceef9df01",
    stacksAddress: ADDR4,
  },
];

export const testnetKeyMap: Record<
  string,
  { address: string; secretKey: string; pubKey: string }
> = Object.fromEntries(
  testnetKeys.map((t) => [
    t.stacksAddress,
    {
      address: t.stacksAddress,
      secretKey: t.secretKey,
      pubKey: publicKeyToString(pubKeyfromPrivKey(t.secretKey)),
    },
  ])
);
