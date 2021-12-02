# == Schema Information
#
# Table name: vaults
#
#  id                :bigint           not null, primary key
#  vault_id          :bigint           not null
#  collateral_amount :bigint           not null
#  debt              :bigint           not null
#  stacking          :boolean          default(FALSE), not null
#  stacker_name      :string
#  closed_at         :boolean
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
class Vault < ApplicationRecord
  validates :vault_id, presence: true
  validates :collateral_amount, presence: true
  validates :debt, presence: true

  has_many :vault_events, dependent: :destroy
end
