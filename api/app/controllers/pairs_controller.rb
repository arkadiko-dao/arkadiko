# This API was created to add Arkadiko Swap to CoinGecko and CMC
class PairsController < ApplicationController

  # Returns all pairs on the Arkadiko Swap
  # ticker_id / base / target / pool_id
  def index
    @pools = Pool.where(enabled: true)

    pairs = @pools.map do |pool|
      {
        ticker_id: "#{pool.token_x.symbol.gsub("wSTX", "STX")}_#{pool.token_y.symbol.gsub("wSTX", "STX")}",
        base: "#{pool.token_x_address}.#{pool.token_x_name}",
        target: "#{pool.token_y_address}.#{pool.token_y_name}",
        pool_id: "#{pool.swap_token_address}.#{pool.swap_token_name}"
      }
    end

    render json: pairs
  end
end
