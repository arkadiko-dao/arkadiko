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
require 'test_helper'

class VaultTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
