# Setup HOWTO

This is high-level. Will be more granular as Arkadiko matures.

1. Set up a local mocknet through docker compose (see https://github.com/blockstack/stacks-local-dev)
2. Change the default Stacks amount of the local mocknet addresses in the toml files (stacks-node-miner/Config.toml.template and stacks-node-follower/Config.toml.template)
  This is optional but helpful if you wanna create vaults with higher STX collateral
3. Run the liquidator test to automatically deploy all smart contracts (`npm test clarity/test/unit/liquidator.ts`)
4. Run the web app using `yarn dev` (in the `web/packages/web` folder)
5. Go to localhost:3000. You need the Stacks Web Wallet to authenticate.

## Contributing

There is no separate CONTRIBUTING.md instructions for now, but you can use the following commits & PR types if you open a PR

|semantic type|description|commit type|0.y.z|
|---|---|---|---|
|chore|changes to build process|ignore||
|docs|documentation only changes|ignore||
|feat|a new feature|minor|patch|
|fix|bug fix|patch||
|refactor|code refactor|patch||
|style|code style changes|ignore||
|test|add missing tests|ignore||
|breaking|introduce breaking changes|major|minor|
|perf|performance improvements|patch||
|tweaks|don't know how to describe|patch||

## Creating a Testnet/Mainnet build

1. Set REACT_APP_CONTRACT_ADDRESS in .env to the correct address that deploys the smart contracts
2. Set REACT_APP_NETWORK_ENV in .env to the correct environment (mocknet/testnet/mainnet)
3. Change oracle-owner in oracle.clar to correct address
4. Comment/Uncomment minting in arkadiko-token.clar (mocknet only)
5. Change auction-reserve address in auction-engine.clar
6. Change mint-owern address in freddie.clar
7. Change address reference in app.tsx (line 78 - 79) & get-balance.ts (line 10 - 11)
8. Run deploy script
