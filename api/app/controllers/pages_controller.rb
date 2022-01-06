class PagesController < ApplicationController
  # UI specific pages - stake page
  # Fetch all Oracle prices
  # Fetch current block height
  # Fetch total stake amounts of LP tokens
  # Fetch stDIKO supply
  # Fetch all pairs on pool
  def stake
    render json: {}
  end
end
