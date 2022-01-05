# == Schema Information
#
# Table name: tokens
#
#  id                 :bigint           not null, primary key
#  address            :string           not null
#  name               :string           not null
#  symbol             :string           not null
#  total_supply       :bigint           default(0), not null
#  last_price         :bigint           default(0), not null
#  price_last_updated :bigint           default(0), not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
require 'test_helper'

class TokenTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
