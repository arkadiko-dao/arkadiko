const network = require('@stacks/network');

async function processing(broadcastedResult, tx, count) {
  const url = `http://localhost:3999/extended/v1/tx/${tx}`;
  var result = await fetch(url);
  var value = await result.json();
  console.log(count);
  if (value.tx_status === "success") {
    console.log(`transaction ${tx} processed`);
    console.log(value);
    return true;
  }
  if (value.tx_status === "pending") {
    console.log(value);
  } else if (count === 3) {
    console.log(value, broadcastedResult);
  }

  if (count > 20) {
    console.log("failed after 10 tries");
    console.log(value);
    return false;
  }

  setTimeout(function() {
    return processing(broadcastedResult, tx, count + 1);
  }, 3000);
}

function resolveNetwork() {
  let coreApiUrl = 'https://stacks-node-api.xenon.blockstack.org';
  coreApiUrl = 'http://localhost:3999';
  const stacksNetwork = new network.StacksTestnet();
  stacksNetwork.coreApiUrl = coreApiUrl;

  return stacksNetwork;
}

exports.resolveNetwork = resolveNetwork;
exports.processing = processing;
