class CreateVaultEvents < ActiveRecord::Migration[5.2]
  def change
    create_table :vault_events do |t|
      t.string :function_name, null: false, index: true
      t.string :transaction_id, null: false
      t.datetime :event_at, null: false, index: true
      t.string :sender, null: false, index: true
      t.references :vault, null: false, index: true
      t.bigint :amount, null: false

      t.timestamps
    end
  end
end
