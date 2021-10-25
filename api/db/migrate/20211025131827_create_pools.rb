class CreatePools < ActiveRecord::Migration[5.2]
  def change
    create_table :pools do |t|
      t.string :token_x_name
      t.string :token_y_name
      t.string :token_x_address
      t.string :token_y_address
      t.string :swap_token_name
      t.string :swap_token_address
      t.bigint :tvl
      t.datetime :tvl_updated_at

      t.timestamps
    end
  end
end
