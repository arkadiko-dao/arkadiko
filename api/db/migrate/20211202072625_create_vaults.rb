class CreateVaults < ActiveRecord::Migration[5.2]
  def change
    create_table :vaults do |t|
      t.bigint :vault_id, index: true, null: false
      t.bigint :collateral_amount, null: false
      t.bigint :debt, null: false
      t.boolean :stacking, default: false, null: false
      t.string :stacker_name, index: true
      t.boolean :closed_at

      t.timestamps
    end
  end
end
