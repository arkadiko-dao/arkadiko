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
#  token_y_id         :bigint
#  token_x_id         :bigint
#  swap_token_id      :bigint
#  balance_x          :bigint
#  balance_y          :bigint
#  shares_total       :bigint
#  enabled            :boolean
#
class Pool < ApplicationRecord
  validates :token_x_name, presence: true
  validates :token_y_name, presence: true

  belongs_to :token_x, class_name: "Token"
  belongs_to :token_y, class_name: "Token"
  belongs_to :swap_token, class_name: "Token"

  has_many :swap_events

  def volume_24h
    events = swap_events.where("function_name IN (?)", ['swap-x-for-y', 'swap-y-for-x']).where(event_at: (Time.now - 24.hours)..Time.now)
    sum_x = events.sum(:token_x_amount)
    sum_y = events.sum(:token_y_amount)
    [sum_x.to_i, sum_y.to_i]
  end

  def volume_7d
    events = swap_events.where("function_name IN (?)", ['swap-x-for-y', 'swap-y-for-x']).where(event_at: (Time.now - 7 * 24.hours)..Time.now)
    sum_x = events.sum(:token_x_amount)
    sum_y = events.sum(:token_y_amount)
    [sum_x.to_i, sum_y.to_i]
  end

  def fetch_prices
    events = swap_events.order('event_at ASC').where("function_name IN (?)", ['swap-x-for-y', 'swap-y-for-x'])
    # TODO: fix performance
    events.map do |event|
      if token_x_name.include?('Wrapped-Bitcoin')
        [event['event_at'].to_i * 1000, (event['token_y_amount'].to_f / (event['token_x_amount'] / 100).to_f)]
      elsif token_y_name.include?('Wrapped-Bitcoin')
        [event['event_at'].to_i * 1000, (event['token_y_amount'].to_f / (event['token_x_amount'] * 100).to_f)]
      else
        [event['event_at'].to_i * 1000, (event['token_y_amount'].to_f / event['token_x_amount'].to_f)]
      end
    end
  end

  def tvl
    add_events = swap_events.where(function_name: 'add-to-position')
    remove_events = swap_events.where(function_name: 'reduce-position')

    added_x = add_events.sum(:token_x_amount).to_i
    added_y = add_events.sum(:token_y_amount).to_i
    removed_x = remove_events.sum(:token_x_amount).to_i
    removed_y = remove_events.sum(:token_y_amount).to_i

    [added_x - removed_x, added_y - removed_y]
  end

  def export_prices
    prices = fetch_prices
    headers = ["timestamp", "price_in_usda"]
    CSV.generate do |csv|
      csv << headers
      prices.each do |price|
        csv << [price[0], price[1]]
      end
    end
  end
end
