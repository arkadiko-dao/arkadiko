# == Schema Information
#
# Table name: pools
#
#  id                 :bigint           not null, primary key
#  token_x_name       :string           not null
#  token_y_name       :string           not null
#  token_x_address    :string           not null
#  token_y_address    :string           not null
#  swap_token_name    :string           not null
#  swap_token_address :string           not null
#  tvl_token_x        :bigint           default(0), not null
#  tvl_token_y        :bigint           default(0), not null
#  tvl_updated_at     :datetime
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
class Pool < ApplicationRecord
  validates :token_x_name, presence: true
  validates :token_y_name, presence: true

  has_many :swap_events
end
