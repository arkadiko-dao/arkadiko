function execute() {
  console.log('1. run price oracle');
  setTimeout(function() {
    require('child_process').fork('update-price.js');
  }, 0);

  console.log('2. end auctions that are running?');
  console.log('3. end governance proposals that are running?');
  console.log('4. liquidate vaults');

  console.log('5. increase cumm rewards');
  setTimeout(function() {
    require('child_process').fork('update-cumm-rewards.js');
  }, 2000);
}

console.log('Running price, auction and governance scripts');
setInterval(execute, 60000 * 20); // every 20 minutes
