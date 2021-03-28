# Setup HOWTO

This is high-level. Will be more granular as Arkadiko matures.

1. Set up a local mocknet through docker compose (see https://github.com/blockstack/stacks-local-dev)
2. Change the default Stacks amount of the local mocknet addresses in the toml files (stacks-node-miner/Config.toml.template and stacks-node-follower/Config.toml.template)
  This is optional but helpful if you wanna create vaults with higher STX collateral
3. Run the liquidator test to automatically deploy all smart contracts (`npm test clarity/test/unit/liquidator.ts`)
4. Run the web app using `yarn dev` (in the `web/packages/web-app` folder)
5. Go to localhost:3000. You need the Stacks Web Wallet to authenticate.
