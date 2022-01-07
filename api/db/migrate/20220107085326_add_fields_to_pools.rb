class AddFieldsToPools < ActiveRecord::Migration[5.2]
  def change
    add_reference :pools, :token_y, foreign_key: { to_table: 'tokens' }, index: true
    add_reference :pools, :token_x, foreign_key: { to_table: 'tokens' }, index: true
    add_reference :pools, :swap_token, foreign_key: { to_table: 'tokens' }, index: true
    add_column :pools, :balance_x, :bigint
    add_column :pools, :balance_y, :bigint
    add_column :pools, :shares_total, :bigint
    add_column :pools, :enabled, :bool, index: true
  end
end
