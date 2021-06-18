function updateOraclePrice() {
  console.log('- run price oracle');
  setTimeout(function() {
    require('child_process').fork('update-price.js');
  }, 0);
}

function executeRewardCalibration() {
  console.log('- increase cumm rewards');
  setTimeout(function() {
    require('child_process').fork('update-cumm-rewards.js');
  }, 2000);
}

function findUnhealthyVaults() {
  console.log('- liquidate vaults');
  // TODO
}

function executeAuctionLogic() {
  console.log('2. end auctions that are running?');
  console.log('3. end governance proposals that are running?');
}

console.log('Running Arkadiko scripts');
setInterval(updateOraclePrice, 60000 * 20); // every 20 mins
setInterval(executeRewardCalibration, 60000 * 45); // every 45 mins
