# == Schema Information
#
# Table name: tokens
#
#  id                 :bigint           not null, primary key
#  address            :string
#  name               :string
#  symbol             :string
#  total_supply       :bigint
#  last_price         :bigint
#  price_last_updated :bigint
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
require 'test_helper'

class TokenTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
