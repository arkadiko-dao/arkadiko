class TickersController < ApplicationController

  # Returns all tickers on the Arkadiko Swap
  # ticker_id / base_currency / target_currency
  # last_price / base_volume / target_volume
  # pool_id / liquidity_in_usd
  # high / low (optional)
  def index
    @pools = Pool.where(enabled: true)

    pairs = @pools.map do |pool|
      volumes = pool.volume_24h
      [high, low] = pool.high_low
      {
        ticker_id: "#{pool.token_x.symbol.gsub("wSTX", "STX")}_#{pool.token_y.symbol.gsub("wSTX", "STX")}",
        base_currency: "#{pool.token_x_address}.#{pool.token_x_name}",
        target_currency: "#{pool.token_y_address}.#{pool.token_y_name}",
        last_price: pool.last_price,
        base_volume: volumes[0],
        target_volume: volumes[1],
        pool_id: "#{pool.swap_token_address}.#{pool.swap_token_name}",
        liquidity_in_usd: pool.tvl_in_usd,
        high: high,
        low: low
      }
    end

    render json: pairs
  end
end
