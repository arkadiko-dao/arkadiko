const c32 = require('c32check');
const stacking = require('@stacks/stacking');

// ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF
const hashbytes = c32.c32addressDecode('ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF');
const btcAddr = c32.c32ToB58('ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF');
console.log('BTC addr:', btcAddr);
console.log(hashbytes);

console.log(stacking.decodeBtcAddress(btcAddr));
