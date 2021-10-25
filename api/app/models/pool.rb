# == Schema Information
#
# Table name: pools
#
#  id                 :bigint           not null, primary key
#  token_x_name       :string
#  token_y_name       :string
#  token_x_address    :string
#  token_y_address    :string
#  swap_token_name    :string
#  swap_token_address :string
#  tvl                :bigint
#  tvl_updated_at     :datetime
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#
class Pool < ApplicationRecord
end
