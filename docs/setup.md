# Setup HOWTO

This is high-level. Will be more granular as Arkadiko matures.

1. Set up a local mocknet through docker compose (see https://github.com/blockstack/stacks-local-dev)
2. Change the default Stacks amount of the local mocknet addresses in the toml files (stacks-local-dev/configurations/mocknet/Config.toml and stacks-local-dev/configurations/mocknet/Config.toml.sample)
  This is optional but helpful if you wanna create vaults with higher STX collateral
3. Run the contract deployment script to deploy all smart contracts (`yarn deploy-contracts` in the `web` folder)
4. Run `yarn install` or `npm install` (in the `web` folder)
5. Run the web app using `yarn dev` or `npm run dev` (in the `web` folder)
6. Go to localhost:3000. You need the Stacks Web Wallet to authenticate.

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

### React app
1. Set REACT_APP_CONTRACT_ADDRESS in .env to the correct address that deploys the smart contracts
2. Set REACT_APP_NETWORK_ENV in .env to the correct environment (mocknet/testnet/mainnet)

### Smart Contracts
1. Add correct CONTRACT_PRIVATE_KEY in .env to deploy
2. Comment/Uncomment minting in arkadiko-token.clar and usda-token.clar
3. Replace SIP10 trait
4. Replace all correct addresses in arkadiko DAO map and pools data in stake registry
5. Run deploy script (deploy-contracts.ts)
6. Deploy external scripts

For testnet:
Faucet: curl -X POST "https://stacks-node-api.testnet.stacks.co/extended/v1/faucets/stx?address=<ADDR>"

### Creating a regtest account

stx make_keychain -t -H "https://stacks-node-api.regtest.stacks.co:20443" -I "https://stacks-node-api.regtest.stacks.co:3999"
