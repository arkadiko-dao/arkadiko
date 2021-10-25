class CreatePools < ActiveRecord::Migration[5.2]
  def change
    create_table :pools do |t|
      t.string :token_x_name, null: false
      t.string :token_y_name, null: false
      t.string :token_x_address, null: false
      t.string :token_y_address, null: false
      t.string :swap_token_name, null: false
      t.string :swap_token_address, null: false
      t.bigint :tvl
      t.datetime :tvl_updated_at

      t.timestamps
    end
  end
end
