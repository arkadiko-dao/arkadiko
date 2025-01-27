require('dotenv').config({path: '../.env'});
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const tx = require('@stacks/transactions');
const utils = require('../utils');
const network = utils.resolveNetwork();

const startBlock = 430544;
const endBlock = 494042;
// const endBlock = 520717;
let url = `https://api.hiro.so/extended/v2/addresses/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-vaults-operations-v1-2/transactions`;
let offset = 0;
// const vaults = {};
const vaults = {
  '2025-01-21': {},
  '2025-01-20': {
    'SPKPDKHT2TH732Q4FZCM3EBS5WFWAT96B5R258S7': '27476221',
    'SP1AX2ND6NE41YNN9C0SDJV2N11X7684RBKQWB9XD': '7631642'
  },
  '2025-01-19': { 'SPTWWMRF4ECHHJV8RSJF3057DNBFQCEMJH1DGTF': '2957181' },
  '2025-01-18': { 'SPTWWMRF4ECHHJV8RSJF3057DNBFQCEMJH1DGTF': '2963672' },
  '2025-01-17': { 'SPTWWMRF4ECHHJV8RSJF3057DNBFQCEMJH1DGTF': '3678332' },
  '2025-01-16': { 'SPTWWMRF4ECHHJV8RSJF3057DNBFQCEMJH1DGTF': '3778342' },
  '2025-01-15': { 'SP1AX2ND6NE41YNN9C0SDJV2N11X7684RBKQWB9XD': '7631642' },
  '2025-01-14': {
    'SP1AX2ND6NE41YNN9C0SDJV2N11X7684RBKQWB9XD': '7340269',
    'SPGBTHP45F4FC5XCGB12KR2VKSBH6AVHWTKB5EN9': '1000000'
  },
  '2025-01-13': { 'SP19NJHSANZW8VC6MKARQS19SVC8BDHT5EA8KB0SY': '997193' },
  '2025-01-12': { 'SPQJN9008GBDXCPVS2CZSPXAPYV8251GZX1GX64R': '1078079' },
  '2025-01-11': {},
  '2025-01-10': {},
  '2025-01-09': { 'SM28JV15D1QRVGDXKPSCAZ23NR5T83WP2HMXD6DP5': '3992492' },
  '2025-01-08': {
    'SPPC8T7J662VJYJM72JS6HV88ETMKMFV1HP9TX2F': '1354390',
    'SPTWWMRF4ECHHJV8RSJF3057DNBFQCEMJH1DGTF': '2055018',
    'SP1X524DYD5G1SRP5NPVW5EWFRTAY8DEEJGK490FN': '1501497',
    'SP22TYSCADAKM5K57E949HFP5ZVQ06PRAVJ700X3': '10000000',
    'SPHKNB2BHPZZJZAQND4ND16P9N5WRK4JCXDEBNEW': '1100000',
    'SP3AYRMSGRYXWGPE9D219AJF7XCNM3EMWXK3QBC91': '889723',
    'SPQRZQWAZ78SE0Y9R571AGTK9V4GT9CWAFAQRNDK': '1160098'
  },
  '2025-01-07': {
    'SP1AX2ND6NE41YNN9C0SDJV2N11X7684RBKQWB9XD': '2723409',
    'SPGQMSR9B2V2ZKPVWG79SPBSPQ2CD14KXFB20PWP': '2926979',
    'SPJXWDR6YPME7X4BZ8PK6WDG76B7DZVHKEPAACF3': '100000000',
    'SP2AGKNTA8QYA2YGQGWPYENCBYZE0AFYJ691Q3F7E': '2000000',
    'SP19NJHSANZW8VC6MKARQS19SVC8BDHT5EA8KB0SY': '997193'
  }
};
const amounts = {};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function exec() {
  let response = await fetch(url, { credentials: 'omit' });
  let data = await response.json();

  // let firstResult = data['results'][0];
  // while (firstResult && firstResult['tx'] && Number(firstResult['tx']['block_height']) > startBlock) {
  //   asyncForEach(data['results'], async (result) => {
  //     const tx = result['tx'];
  //     const function_name = tx['contract_call']['function_name'];
  //     const blockHeight = Number(tx['block_height']);
  //     const collateral = tx['contract_call']['function_args'][6];

  //     if (
  //       blockHeight >= startBlock &&
  //       blockHeight <= endBlock &&
  //       tx['tx_status'] === 'success' &&
  //       ['open-vault', 'update-vault', 'close-vault'].includes(function_name) &&
  //       collateral &&
  //       collateral['repr'].includes("sbtc-token")
  //     ) {
  //       const blockTime = tx['block_time_iso'].split("T")[0];
  //       const sender = tx['sender_address']
  //       if (!vaults[blockTime]) vaults[blockTime] = {};
  //       if (!vaults[blockTime][sender]) vaults[blockTime][sender] = 0;

  //       if (function_name === 'open-vault') {
  //         const amount = tx['contract_call']['function_args'][7]['repr'].replace('u', '');
  //         vaults[blockTime][sender] = amount;
  //       } else if (function_name === 'update-vault') {
  //         const amount = tx['contract_call']['function_args'][7]['repr'].replace('u', '');
  //         vaults[blockTime][sender] = amount;
  //       } else {
  //         // close vault
  //         vaults[blockTime][sender] = 0;
  //       }
  //     }
  //   });

  //   offset += 20;
  //   response = await fetch(url + `?offset=${offset}`, { credentials: 'omit' });
  //   data = await response.json();
  //   firstResult = data['results'][0];
  // }

  // console.log(vaults);
  const keys = Object.keys(vaults).reverse();
  let previousKeys = [];
  keys.forEach((key) => {
    // const totalCollateral = Object.values(vaults[key]);
    // const initialValue = 0;
    // const sumWithInitial = totalCollateral.reduce(
    //   (accumulator, currentValue) => accumulator + Number(currentValue),
    //   initialValue,
    // );
    // console.log(sumWithInitial);
    previousKeys.push(key);
    const [totalCollateral, addressCollaterals] = calculateCollateral(previousKeys);
    console.log('Total collateral for', key, `${totalCollateral / 100000000.0} sBTC`);

    // const addresses = Object.keys(vaults[key]);
    const addresses = collectAddresses(previousKeys);
    addresses.forEach((address) => {
      const addressCollateral = Number(addressCollaterals[address]) / 100000000.0;
      const formattedCollateral = totalCollateral / 100000000.0;
      console.log(key, address, `${addressCollateral} sBTC`, `${(addressCollateral / formattedCollateral * 2000.0).toFixed(0)} DIKO`);
    });

    console.log('\n');
  });
};

function collectAddresses(keys) {
  const allAddresses = [];
  const addressesSeen = {};
  keys.forEach((key, idx) => {
    const dailyAddresses = vaults[key];
    Object.keys(dailyAddresses).forEach((address) => {
      const amount = Number(dailyAddresses[address]);
      // TODO: need to remove address if collateral value is 0
      if (amount > 0 && !addressesSeen[address]) allAddresses.push(address);
      addressesSeen[address] = true;
    });
  });

  return allAddresses;
}

function calculateCollateral(keys) {
  let totalCollateral = 0;
  const addressesSeen = {};
  keys.forEach((key, idx) => {
    const dailyCollaterals = vaults[key];
    Object.keys(dailyCollaterals).forEach((address) => {
      const amount = Number(dailyCollaterals[address]);
      if (!addressesSeen[address]) {
        addressesSeen[address] = amount;
        totalCollateral += amount;
      } else {
        // already had seen address, need to add collateral
        const diff = addressesSeen[address] - amount;
        let newAmount = amount + diff;
        addressesSeen[address] = newAmount;
        totalCollateral += newAmount;
      }
    });
  });

  return [totalCollateral, addressesSeen];
}

exec();
