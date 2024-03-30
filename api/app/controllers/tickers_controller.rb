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
      high, low = pool.high_low
      token_x = pool.token_x
      token_y = pool.token_y
      balances = pool.tvl_in_usd
      usd_tvl_x = (balances[0] / 1_000_000.0) * (token_x.last_price / 1_000_000.0)
      usd_tvl_y = (balances[1] / 1_000_000.0) * (token_y.last_price / 1_000_000.0)
      {
        ticker_id: "#{token_x.symbol.gsub("wSTX", "STX")}_#{token_y.symbol.gsub("wSTX", "STX")}",
        base_currency: "#{pool.token_x_address}.#{pool.token_x_name}",
        target_currency: "#{pool.token_y_address}.#{pool.token_y_name}",
        last_price: pool.last_price,
        base_volume: volumes[0] / 1_000_000.0,
        target_volume: volumes[1] / 1_000_000.0,
        base_price: token_x.last_price / 1_000_000.0,
        target_price: token_y.last_price / 1_000_000.0,
        pool_id: "#{pool.swap_token_address}.#{pool.swap_token_name}",
        liquidity_in_usd: (usd_tvl_x + usd_tvl_y),
        high: high,
        low: low
      }
    end

    render json: pairs
  end
end
