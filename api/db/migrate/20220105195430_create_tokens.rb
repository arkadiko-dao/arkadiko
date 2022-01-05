class CreateTokens < ActiveRecord::Migration[5.2]
  def change
    create_table :tokens do |t|
      t.string :address
      t.string :name
      t.string :symbol
      t.bigint :total_supply
      t.bigint :last_price
      t.bigint :price_last_updated

      t.timestamps
    end
  end
end
