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
