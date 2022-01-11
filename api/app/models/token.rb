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
#  total_staked       :bigint           default(0), not null
#  decimals           :bigint           default(6), not null
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
class Token < ApplicationRecord
  validates :symbol, presence: true
  validates :name, presence: true
  validates :address, presence: true
end
