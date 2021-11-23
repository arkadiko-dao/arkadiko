class CreateSwapEvents < ActiveRecord::Migration[5.2]
  def change
    create_table :swap_events do |t|
      t.string :function_name, null: false, index: true
      t.string :transaction_id, null: false
      t.datetime :event_at, null: false, index: true
      t.string :sender, null: false, index: true
      t.references :pool, null: false, index: true
      t.bigint :token_x_amount, null: false
      t.bigint :token_y_amount, null: false

      t.timestamps
    end
  end
end
