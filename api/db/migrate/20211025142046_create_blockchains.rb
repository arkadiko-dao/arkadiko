class CreateBlockchains < ActiveRecord::Migration[5.2]
  def change
    create_table :blockchains do |t|
      t.bigint :last_block_height_imported

      t.timestamps
    end
  end
end
