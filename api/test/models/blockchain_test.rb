# == Schema Information
#
# Table name: blockchains
#
#  id                         :bigint           not null, primary key
#  last_block_height_imported :bigint
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  vaults_tvl                 :bigint
#  swap_tvl                   :bigint
#
require 'test_helper'

class BlockchainTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
