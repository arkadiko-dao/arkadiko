# Arkadiko Admin Smart Contract Calls

The below calls can be used to call admin-only functions to manage Arkadiko. Nonces can be found on the smart contract address in the explorer (e.g. https://explorer.stacks.co/address/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?chain=testnet).

1. Withdraw USDA revenue from Freddie

Regtest:
`stx call_contract_func -t -H "https://stacks-node-api.regtest.stacks.co" -I "https://stacks-node-api.regtest.stacks.co" --contract_address ST1A0EP8AWV24G1BETM154DYWXGB4Q7MDB5WXXFTB --contract_name arkadiko-freddie-v1-1 --function_name redeem-tokens --fee 500 --nonce 122 --payment_key KEY`

2. Stack in PoX

Regtest:
`stx call_contract_func -t -H "https://stacks-node-api.regtest.stacks.co" -I "https://stacks-node-api.regtest.stacks.co" --contract_address ST1A0EP8AWV24G1BETM154DYWXGB4Q7MDB5WXXFTB --contract_name arkadiko-stacker-v1-1 --function_name initiate-stacking --fee 500 --nonce 122 --payment_key KEY`

3. Withdraw Swap revenue

`stx call_contract_func -t -H "https://stacks-node-api.regtest.stacks.co" -I "https://stacks-node-api.regtest.stacks.co" --contract_address ST1A0EP8AWV24G1BETM154DYWXGB4Q7MDB5WXXFTB --contract_name arkadiko-swap-v1-1 --function_name collect-fees --fee 500 --nonce 122 --payment_key KEY`

4. Foundation Claim DIKO

`stx call_contract_func -t -H "https://stacks-node-api.regtest.stacks.co" -I "https://stacks-node-api.regtest.stacks.co" --contract_address ST1A0EP8AWV24G1BETM154DYWXGB4Q7MDB5WXXFTB --contract_name arkadiko-diko-init --function_name foundation-claim-tokens --fee 500 --nonce 123 --payment_key KEY`

5. Get collateral amount

`stx call_read_only_contract_func -t -H "https://stacks-node-api.regtest.stacks.co" -I "https://stacks-node-api.regtest.stacks.co" ST1A0EP8AWV24G1BETM154DYWXGB4Q7MDB5WXXFTB arkadiko-vault-rewards-v1-1 get-collateral-amount-of ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF`

6. Update Vault Rewards

`stx call_contract_func -t -H "https://stacks-node-api.regtest.stacks.co" -I "https://stacks-node-api.regtest.stacks.co" --contract_address ST1A0EP8AWV24G1BETM154DYWXGB4Q7MDB5WXXFTB --contract_name arkadiko-vault-rewards-v1-1 --function_name increase-cumm-reward-per-collateral --fee 500 --nonce 123 --payment_key KEY`

6. Enable Vault Withdrawals

`stx call_contract_func -t -H "https://stacks-node-api.regtest.stacks.co" -I "https://stacks-node-api.regtest.stacks.co" --contract_address ST1A0EP8AWV24G1BETM154DYWXGB4Q7MDB5WXXFTB --contract_name arkadiko-stacker-v1-1 --function_name enable-vault-withdrawals --fee 500 --nonce 122 --payment_key KEY`


## HOWTO: Start Stacking in Arkadiko

0. In Development Only - Transfer tokens to STX reserve

`curl -s -X POST "http://localhost:3999/extended/v1/faucets/stx?address=ST3DSDDH2H2QFA6BHEVKTSK5NK54SJWSKB6MQKM8Z&stacking=true"`

3x `yarn deploy-contracts`

`stx send_tokens -t -H "http://localhost:3999" -I "http://localhost:3999" --address ST1QV6WVNED49CR34E58CRGA0V58X281FAS1TFBWF --amount 56480000000000 --fee 500 --nonce 46 --payment_key PRIVATE_KEY`

1. Set Tokens to Stack

`stx call_contract_func -t -H "http://localhost:3999" -I "http://localhost:3999" --contract_address ST3DSDDH2H2QFA6BHEVKTSK5NK54SJWSKB6MQKM8Z --contract_name arkadiko-stx-reserve-v1-1 --function_name set-tokens-to-stack --fee 500 --nonce 49 --payment_key KEY`
(1534000000000000)
(55479999000000)


2. Check if tokens are set

`stx call_read_only_contract_func -t -H "http://localhost:3999" -I "http://localhost:3999" --contract_address ST3DSDDH2H2QFA6BHEVKTSK5NK54SJWSKB6MQKM8Z --contract_name arkadiko-stx-reserve-v1-1 --function_name get-tokens-to-stack --sender_address ST3DSDDH2H2QFA6BHEVKTSK5NK54SJWSKB6MQKM8Z`

`stx call_read_only_contract_func -t -H "http://localhost:3999" -I "http://localhost:3999" --contract_address ST3DSDDH2H2QFA6BHEVKTSK5NK54SJWSKB6MQKM8Z --contract_name arkadiko-stacker-v1-1 --function_name get-stx-balance --sender_address ST3DSDDH2H2QFA6BHEVKTSK5NK54SJWSKB6MQKM8Z`

3. `node update-price.js`

4. Create a vault

5. `node initiate-stacking.js`

6. is pox active

`stx call_read_only_contract_func -t -H "http://localhost:3999" -I "http://localhost:3999" --contract_address ST000000000000000000002AMW42H --contract_name pox --function_name is-pox-active --sender_address ST3DSDDH2H2QFA6BHEVKTSK5NK54SJWSKB6MQKM8Z`

7. get stacker info

`stx call_read_only_contract_func -t -H "http://localhost:3999" -I "http://localhost:3999" --contract_address ST000000000000000000002AMW42H --contract_name pox --function_name get-stacker-info --sender_address ST3DSDDH2H2QFA6BHEVKTSK5NK54SJWSKB6MQKM8Z`
