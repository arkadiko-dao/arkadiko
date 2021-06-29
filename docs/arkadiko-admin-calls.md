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

`stx call_contract_func -t -H "https://stacks-node-api.regtest.stacks.co" -I "https://stacks-node-api.regtest.stacks.co" --contract_address ST1A0EP8AWV24G1BETM154DYWXGB4Q7MDB5WXXFTB --contract_name arkadiko-freddie-v1-1 --function_name enable-vault-withdrawals --fee 500 --nonce 122 --payment_key KEY`
