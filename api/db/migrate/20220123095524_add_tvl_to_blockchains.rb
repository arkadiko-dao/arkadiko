class AddTvlToBlockchains < ActiveRecord::Migration[5.2]
  def change
    add_column :blockchains, :vaults_tvl, :bigint
    add_column :blockchains, :swap_tvl, :bigint
  end
end
