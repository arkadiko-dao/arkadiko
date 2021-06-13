function execute() {
  console.log('1. run price oracle');
  require('child_process').fork('update-price.js');

  console.log('2. end auctions that are running?');
  console.log('3. end governance proposals that are running?');
  console.log('4. liquidate vaults');
}

console.log('Running price, auction and governance scripts');
setInterval(execute, 60000 * 20); // every 20 minutes
