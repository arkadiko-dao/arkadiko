# == Schema Information
#
# Table name: vault_events
#
#  id             :bigint           not null, primary key
#  function_name  :string           not null
#  transaction_id :string           not null
#  event_at       :datetime         not null
#  sender         :string           not null
#  vault_id       :bigint           not null
#  amount         :bigint           not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
require 'test_helper'

class VaultEventTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
