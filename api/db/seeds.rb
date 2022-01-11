# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

Blockchain.create!(last_block_height_imported: 34500)
Pool.create!(
  token_x_address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  token_x_name: 'wrapped-stx-token',
  token_y_address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  token_y_name: 'usda-token',
  swap_token_address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  swap_token_name: 'arkadiko-swap-token-wstx-usda'
)

Pool.create!(
  token_x_address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  token_x_name: 'arkadiko-token',
  token_y_address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  token_y_name: 'usda-token',
  swap_token_address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  swap_token_name: 'arkadiko-swap-token-diko-usda'
)

Pool.create!(
  token_x_address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  token_x_name: 'wrapped-stx-token',
  token_y_address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  token_y_name: 'arkadiko-token',
  swap_token_address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  swap_token_name: 'arkadiko-swap-token-wstx-diko'
)

Pool.create!(
  token_x_address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  token_x_name: 'wrapped-stx-token',
  token_y_address: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G',
  token_y_name: 'welshcorgicoin-token',
  swap_token_address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  swap_token_name: 'arkadiko-swap-token-wstx-welsh',
  token_x: Token.find_by(symbol: 'wSTX'),
  token_y: Token.find_by(symbol: 'WELSH'),
  swap_token: Token.find_by(symbol: 'ARKV1WSTXWELSH')
)

# Tokens
Token.create!(
  address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  name: 'wrapped-stx-token',
  symbol: 'wSTX'
)

Token.create!(
  address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  name: 'arkadiko-token',
  symbol: 'DIKO'
)

Token.create!(
  address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  name: 'usda-token',
  symbol: 'USDA'
)

Token.create!(
  address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  name: 'stdiko-token',
  symbol: 'stDIKO'
)

Token.create!(
  address: 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR',
  name: 'Wrapped-Bitcoin',
  symbol: 'xBTC'
)

Token.create!(
  address: 'SP3NE50GEXFG9SZGTT51P40X2CKYSZ5CC4ZTZ7A2G',
  name: 'welshcorgicoin-token',
  symbol: 'WELSH'
)

Token.create!(
  address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  name: 'arkadiko-swap-token-diko-usda',
  symbol: 'ARKV1DIKOUSDA'
)

Token.create!(
  address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  name: 'arkadiko-swap-token-wstx-usda',
  symbol: 'ARKV1WSTXUSDA'
)

Token.create!(
  address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  name: 'arkadiko-swap-token-wstx-diko',
  symbol: 'ARKV1WSTXDIKO'
)

Token.create!(
  address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  name: 'arkadiko-swap-token-wstx-xbtc',
  symbol: 'ARKV1WSTXXBTC'
)

Token.create!(
  address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  name: 'arkadiko-swap-token-xbtc-usda',
  symbol: 'ARKV1XBTCUSDA'
)

Token.create!(
  address: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
  name: 'arkadiko-swap-token-wstx-welsh',
  symbol: 'ARKV1WSTXWELSH'
)
