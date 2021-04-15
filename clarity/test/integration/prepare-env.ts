import BN from 'bn.js';
import {
  standardPrincipalCV,
  makeSTXTokenTransfer,
  createStacksPrivateKey,
  privateKeyToString,
  stringAsciiCV,
  uintCV,
  makeContractCall,
  contractPrincipalCV
} from "@stacks/transactions";
import {
  deployContract,
  handleTransaction,
  network,
  secretDeployKey
} from "../../../shared/utils";

console.log('Preparing mocknet environment with dummy data');

const testnetKeyMap = [
  {
    address: 'ST2MAMQTXNYVPQZN18QEV86Y53CHDEE4F6480C8NF',
    secretKey: '6fdb1e37b930e4813bc16457aeff78945f8026fcbd0712f138465ff2075fbac0',
    pubKey: '0479e168eb5c17b1ae9080c6bfb919cd386fb00e7788fa0f8d1a4f042ba064e48d00b00ef1afcc8ebd069679f04372b25308481ba531c435ec3e319d65ceafb78c'
  },
  {
    address: 'ST3J2X3SF9YVW6KCQMFTV3SABA5S25162H4TW0G82',
    secretKey: 'd1e3d0048ef8aac81a90003374dab19637f3c128d9c0216f3ccbaa660ba68d97',
    pubKey: '041ec2f65a7a8652a827fa2922dfdb2d851c4f709791db0f3d96d9f7640e3fd289f567cedcead5e3e6f16b67fd01a66c483d9c06af78e53b054c3c7d8e2e3506ea'
  },
  {
    address: 'ST108RMT4WK56T13S966ZBK6MRE80H2XX7VQK4RF7',
    secretKey: '74aa4f10959fe8d340f2f8b3043ab11b561ffbfcd0a77fde4f0d791dd4b4699a',
    pubKey: '04b9bf946577d29d76f6c55a8339c437b3fe094a70831a77e7a049f829740f86ac06312d16ff91418243fe4be6a41c9da6221878bfec3487fa49d93a83b55fdc4d'
  },
  {
    address: 'ST1CTESJV5BRYSPQ1GKRZ1CGXKP32EJVF53JS2SBT',
    secretKey: '1c26cfdc7fd7a0231390a8464482f36da697473d3c8a212c87b3a00d30bacb4b',
    pubKey: '04ff2c8446becb5cbac4ff95fea44f3fbeccad9206fb3d01c6b41fef4c4f2350d850f2a5edf6e6fb14bbf01908abb8d0d3e4413cc149a98098993d6fe44a361a73'
  },
  {
    address: 'ST3Q2W8E3Z835PVFMD1QRMQFQWZEY5RQSW1NPXR97',
    secretKey: '504fe2c2fcf428a046ccb43434f78ac8097715f009d6069d5afc1b30b91b5d1d',
    pubKey: '049867834980060bd9003dacfdd91b997276dd76489ad0bdd7c5ccab03e7961578cfe5489f3d930f22c58a264d6c6b2e75d2ddac18656c590f3dfe77f916e2cf19'
  },
  {
    address: 'ST1R367GHSPMB74S85JF6E4VM438Y00566Q05M5KV',
    secretKey: 'e231a5d1faa8b571ccd3333322b2393bb763a49d570f7b9756d8fc65ab490eb5',
    pubKey: '04a0b3ea1f5d0e90d937083131af475202d14f4bc68b1aa179fa5107f937474533a0eb82254c6a4a10fd3ff221f50b93d8a69cf2d77d066c8add7610b41a49c101'
  },
  {
    address: 'ST20EPVJR9CMZ556ZXTD435TDZ6YC2SRTJVX6E46X',
    secretKey: 'c89b961f24aae70d95ee79c4d2bf515fc5cc57e7f2c6288cd31665f8e6ccc8ec',
    pubKey: '046f72049490cb63be0d17f8a06336fd3c131575b552f7242eced74baa28608dbe5b90115952731221cb281594532da064c0735bad2eb7f195401dcd83caed8d77'
  },
  {
    address: 'STPAGMKPBXHVDH3E84TMEXNWBP5GS43AVK1J7QQ5',
    secretKey: 'b660fab6a5dceeea210e6cc7cffa3f23923a9ddd08143808a7c252557984cf96',
    pubKey: '04b6d24d996b1670e313fc329eec228977028814f5cfc30ba0ae8df43fec15fc895c9d5758cef115b35757f493d1b1e661bb36499e689bd4f7a18a7e8a528bacdf'
  },
  {
    address: 'ST362KCRHMK4VJNNWM8B3XX66BHP3KNXXMZT77G3V',
    secretKey: 'aa699afd997b0536d2337966a7024995040c67acf42d07cd6d888ec9e29d34fa',
    pubKey: '0441d1b3dcc9919f64a46cf9ab8341e6997b1461942d5539789717b64c97ed244d94a021cec1d6b71e195dcbe4aed09732a00e1ab1b51d5ed436360b597f87c978'
  },
  {
    address: 'ST1986Y8F2MVM0HETJTWQKDHF0TSK7KAWT25HPZ9',
    secretKey: '0c9363d45c33e04dae6d096db06801c59c44ee932592e45195172719e57aeba6',
    pubKey: '0415bbdeb64ab89ff8ebefcb2a2fa201f7abe34d4aa097593c2b39b24fef52bab4580fd6b2afab7e6981e73a4360f6c0e91f7019cd24668702e2dfd03c1ef7afb2'
  },
  {
    address: 'ST3XSC2AJ896VWD60NPT69NTF56FR9VZWW6F27TPW',
    secretKey: '111e99d73b4ed4730e4123bedaaddb2dfa52750eeaad710055c16035639b4db4',
    pubKey: '0406659550a3cc648880eb4aabb6b71b2e2f13b12352034dc88ab88b23fe1b5041b9cc219aa5313f92f91c89d6c822c01f88ff3c79fac12d398dc7ef3d3b1ce94f'
  },
  {
    address: 'STZQ16T49VJK13QMXYPHDHDV6SVRV3KEY668VPXJ',
    secretKey: '5a8389c55fdc4828279c21761e73e1d3dbbc09c18f3fbe06bc11b1959be6acdc',
    pubKey: '040be706c7dbba4f4a8be3aec5b8c4f2936929f4681c1bade53f1764f2a9020aa86bbb8b79dbc409272b69da43f3ea505f2bf3a54baecb05bbb09bec2e4c7de3a8'
  },
  {
    address: 'STYG8JFQG2K88TFJ4S77ERTJH1WKDYR82G07ADFF',
    secretKey: '6d2b730af62f6c90f4c9d127f2c78e417250a7fd5048b4c44939b0a0bcab6921',
    pubKey: '0448200c6076ca01c961072398519cc8bba0fff9a925f8e70774790e837aeef859b8664711ff63cd8583ff7bc30feecfd6174c3765ed3242147fc40add096a0f48'
  },
  {
    address: 'ST19QJEKVQBC5MRVMETWMFV9VP8STQTAK1GWZHG3M',
    secretKey: '0c2b2ab1b1ae5c07d56c1c35b017e9ef08c540e83a9c12bf26fe5077057c77c2',
    pubKey: '04d730e543261ee3d38af0fce8801da2d9ff7fc1b4ed6adcdd7a0bf3e240408f90abed61ceb11d7bbba22f9b76236323258aab5f9191888b6b6e73e8d677efc1ab'
  },
  {
    address: 'ST19DNRF8PC1QRGSYHV75JT8MY0K8F26ZFVH15K8E',
    secretKey: '48c36bc4a21c93c964769d5161d89324511e4551dfacabf5f1a1c9ad00749269',
    pubKey: '0418dd284e05dd854e8696835bc08029849eabce97b5bd6ace781928e54f2be9674e46a75a99dd0d4a07aa60b5251a57e8b0e652de2583b3bac2a26838dc5928cf'
  },
  {
    address: 'STBBGMFA347WVH5HWBP5MSH42ZKKAZ3EFVA71FCK',
    secretKey: '78b28a5c7382fa24342d0c4296c278bab98f05069678d8d2341e6f28a9ce22c2',
    pubKey: '04f77e572f555e33aa4cd0d85a61e192868ed3d71a637f32cb3507165e483ec201b48acb25724f32a794435c50e810876e947c2d87b4301d55f94efbb601893047'
  },
  {
    address: 'ST3KYAJ68CZ8S1R2DATR57AMWX0VYKC7Z0D1FT9PA',
    secretKey: '870816e195247f14e9f52ad7ef2415ffe39bfb2f94f69583e4949cb093bf61e8',
    pubKey: '04cf454ea0ca641b2f617340bf1e07db5b9bb98e2909eef45a61df639abe5b174b137bf21ad1488a0a67c20d4fc6dc3a360a8e66bb172cb6d9b2a838a3e5f99e6c'
  },
  {
    address: 'ST2P6TJW3N5BZQ819WSJBWT7EG01CR5XTMYQ3W09Z',
    secretKey: '20b9192b1dc63a6468270adbe437970d193fe8c05d33f1547f13a85a226f0eca',
    pubKey: '04f1c636d8c99b27d5289d5b18425dfadbc95a5aabd3fcbfed0d844c809a631c6e27d2dc8ac87fc2a9445a261cdf5f96d0dbe55338ba21e0d312d54cca1993a856'
  },
  {
    address: 'ST1ECEB9AZ0DYRAAF50KHES1YYSYCH0PYAZBVPJXZ',
    secretKey: 'e4c1bb734e8b580249fc1be6069945319da96f988705656c016322cbfedf2af4',
    pubKey: '0479816241806cffd4b19be3c5a50833bb387e66420d8bd340338880d94932f1347418ce12df5070469f562cb2cb1e7803748597918bb1e857b4b812aaf00e4080'
  },
  {
    address: 'STBXRZVWRM6W0XGEKNNMDB1HMZEMFP9GFCSWRYVT',
    secretKey: '3daec7c53f4e7b0a61ae37349ce8dc5f8bfa70fb6c624ea9e19c6683bd07b4cf',
    pubKey: '0495aa2863e5536254a949484382eaf17a736b71fdc865c35df9ff45b98536d0866aeae1139bdcdb79ad415a15a406c5fa2cb6b051e0c3daac49c9000f1d69077a'
  }
];
// const getNonce = async (address: string) => {
//   const url = `http://localhost:3999/v2/accounts/${address}?proof=0`;
//   const result = await request(url, { json: true });
//   return result.nonce;
// }
const addMocknetStx = async (address: string) => {
  const key = '9aef533e754663a453984b69d36f109be817e9940519cc84979419e2be00864801';
  const senderKey = createStacksPrivateKey(key);

  const transaction = await makeSTXTokenTransfer({
    recipient: standardPrincipalCV(address),
    amount: new BN(5000000000),
    senderKey: privateKeyToString(senderKey),
    network: network
  });
  return await handleTransaction(transaction);
};

describe("environment prep", () => {
  describe("deploying an instance of the contract", () => {
    before(async () => {
      await deployContract('mock-ft-trait');
      await deployContract('vault-trait');

      await deployContract('oracle');
      await deployContract('xusd-token');
      await deployContract('arkadiko-token');
      await deployContract('mock-pox');
      await deployContract('dao');

      await deployContract('stx-reserve');
      await deployContract('sip10-reserve');
      await deployContract('freddie');

      await deployContract('stacker-registry');
      await deployContract('auction-engine');
      await deployContract('liquidator');
    });

    it("sets up a local environment", async () => {
      const stxPrice = 1.95;
      let index = 1;
      const randomNumber = (min:number, max:number) => {
        return Math.floor(Math.random() * (max - min+1)+min);
      };

      // 1. Add a list of (e.g. 20) addresses
      testnetKeyMap.forEach(async (element) => {
        // get balance with curl "http://localhost:3999/extended/v1/address/ST2P6TJW3N5BZQ819WSJBWT7EG01CR5XTMYQ3W09Z/balances"
        setTimeout(() => addMocknetStx(element.address), index * 10000);
        index += 1;
      });

      // 2. Set the price of STX
      // const txOptions = {
      //   contractAddress: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7',
      //   contractName: 'oracle',
      //   functionName: 'update-price',
      //   functionArgs: [stringAsciiCV('stx'), uintCV(stxPrice * 100)],
      //   senderKey: secretDeployKey,
      //   postConditionMode: 1,
      //   network
      // };
      // setTimeout(async () => handleTransaction(await makeContractCall(txOptions)), 10000);

      // 2b. Set the price of DIKO
      // const dikoTxOptions = {
      //   contractAddress: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7',
      //   contractName: 'oracle',
      //   functionName: 'update-price',
      //   functionArgs: [stringAsciiCV('diko'), uintCV(stxPrice * 100)],
      //   senderKey: secretDeployKey,
      //   postConditionMode: 1,
      //   network
      // };
      // setTimeout(async () => handleTransaction(await makeContractCall(dikoTxOptions)), 20000);

      // 3. Add at least one vault per address and collateral type
      const collateralTypes = [
        {
          type: 'stx-a',
          symbol: 'stx',
          reserve: 'stx-reserve',
          token: 'arkadiko-token'
        },
        {
          type: 'stx-b',
          symbol: 'stx',
          reserve: 'stx-reserve',
          token: 'arkadiko-token'
        },
        {
          type: 'diko-a',
          symbol: 'diko',
          reserve: 'sip10-reserve',
          token: 'arkadiko-token'
        }
      ];

      index = 1;
      testnetKeyMap.forEach(async (element) => {
        setTimeout(async () => {
          let collateralAmount = randomNumber(3000, 4500);
          let usdAmount = randomNumber(0.1 * collateralAmount, 0.2 * collateralAmount * stxPrice);
          let collateralType = collateralTypes[randomNumber(0, 2)];
          let mintVaultArgs = [
            uintCV(collateralAmount * 1000000),
            uintCV(usdAmount * 1000000), // randomise this to generate something between 400 and (STX_PRICE * 450 - X)
            standardPrincipalCV(element.address),
            stringAsciiCV(collateralType['type']), // randomise this to use STX-A, STX-B or DIKO-A
            stringAsciiCV(collateralType['symbol']),
            contractPrincipalCV('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7', collateralType['reserve']),
            contractPrincipalCV('STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7', collateralType['token'])
          ];
          let txMintOptions = {
            contractAddress: 'STSTW15D618BSZQB85R058DS46THH86YQQY6XCB7',
            contractName: 'freddie',
            functionName: 'collateralize-and-mint',
            functionArgs: mintVaultArgs,
            senderKey: element.secretKey,
            postConditionMode: 1,
            network
          };
          handleTransaction(await makeContractCall(txMintOptions));
        }, index * 10000);
        index += 1;
      });

      // 5. Make most STX vaults stacking, some not
      // toggle-stacking
      // Outside of this 6. Run scripts regularly: scan vaults, accrue stability fees, end auction, end proposal, update price
    });
  });
});
