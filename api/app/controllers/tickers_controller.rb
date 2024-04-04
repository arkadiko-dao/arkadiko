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
      decimals_x = 10.0**token_x.decimals
      decimals_y = 10.0**token_y.decimals
      usd_tvl_x = (balances[0] / decimals_x) * (token_x.last_price / decimals_x)
      usd_tvl_y = (balances[1] / decimals_y) * (token_y.last_price / decimals_y)
      {
        ticker_id: "#{token_x.symbol.gsub("wSTX", "STX")}_#{token_y.symbol.gsub("wSTX", "STX")}",
        base_currency: "#{pool.token_x_address}.#{pool.token_x_name}",
        target_currency: "#{pool.token_y_address}.#{pool.token_y_name}",
        last_price: pool.last_price,
        base_volume: volumes[0] / decimals_x,
        target_volume: volumes[1] / decimals_y,
        base_price: token_x.last_price / decimals_x,
        target_price: token_y.last_price / decimals_y,
        pool_id: "#{pool.swap_token_address}.#{pool.swap_token_name}",
        liquidity_in_usd: (usd_tvl_x + usd_tvl_y),
        high: high,
        low: low
      }
    end

    render json: pairs
  end
end
