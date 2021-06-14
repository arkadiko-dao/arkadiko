# Arkadiko Admin Smart Contract Calls

The below calls can be used to call admin-only functions to manage Arkadiko. Nonces can be found on the smart contract address in the explorer (e.g. https://explorer.stacks.co/address/STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6?chain=testnet).

1. Withdraw xUSD revenue from Freddie

Regtest:
`stx call_contract_func -t -H "https://stacks-node-api.regtest.stacks.co" -I "https://stacks-node-api.regtest.stacks.co" --contract_address ST2SVD7CS7HB1DV7T4AXZJ9DZAQC7C9QMQF7X356R --contract_name arkadiko-freddie-v1-1 --function_name redeem-tokens --fee 500 --nonce 122 --payment_key KEY`

2. Stack in PoX

Regtest:
`stx call_contract_func -t -H "https://stacks-node-api.regtest.stacks.co" -I "https://stacks-node-api.regtest.stacks.co" --contract_address ST2SVD7CS7HB1DV7T4AXZJ9DZAQC7C9QMQF7X356R --contract_name arkadiko-stacker-v1-1 --function_name initiate-stacking --fee 500 --nonce 122 --payment_key KEY`

3. Withdraw Swap revenue

`stx call_contract_func -t -H "https://stacks-node-api.regtest.stacks.co" -I "https://stacks-node-api.regtest.stacks.co" --contract_address ST2SVD7CS7HB1DV7T4AXZJ9DZAQC7C9QMQF7X356R --contract_name arkadiko-swap-v1-1 --function_name collect-fees --fee 500 --nonce 122 --payment_key KEY`
