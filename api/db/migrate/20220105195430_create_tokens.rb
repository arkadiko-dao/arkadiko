class CreateTokens < ActiveRecord::Migration[5.2]
  def change
    create_table :tokens do |t|
      t.string :address, null: false
      t.string :name, null: false
      t.string :symbol, null: false
      t.bigint :total_supply, null: false, default: 0
      t.bigint :last_price, null: false, default: 0
      t.bigint :price_last_updated, null: false, default: 0
      t.bigint :total_staked, null: false, default: 0
      t.bigint :decimals, null: false, default: 6

      t.timestamps
    end

    add_index :tokens, [:address, :name]
    add_index :tokens, :symbol
  end
end
