class PagesController < ApplicationController
  # UI specific pages - stake page
  # Fetch all Oracle prices
  # Fetch current block height
  # Fetch total stake amounts of LP tokens
  # Fetch stDIKO supply
  # Fetch all pairs on pool
  def stake
    block_height = Blockchain.first.last_block_height_imported
    hsh = { block_height: block_height }
    tokens = Token.where(symbol: [
      'wSTX', 'DIKO', 'USDA', 'stDIKO',
      'ARKV1WSTXXBTC', 'ARKV1XBTCUSDA',
      'ARKV1WSTXDIKO', 'ARKV1WSTXUSDA',
      'ARKV1DIKOUSDA', 'amm-swap-pool'
    ])
    tokens.find_each do |token|
      hsh[token.symbol.downcase] = token
    end
    pools = Pool.all
    pools.find_each do |pool|
      hsh["#{pool.token_x_name}/#{pool.token_y_name}"] = pool
    end

    render json: hsh
  end

  def swap
    block_height = Blockchain.first.last_block_height_imported
    hsh = { block_height: block_height }
    pools = Pool.all
    pools.find_each do |pool|
      hsh["#{pool.token_x_name}/#{pool.token_y_name}"] = pool
    end

    render json: hsh
  end

  def oracle
    block_height = Blockchain.first.last_block_height_imported
    hsh = { block_height: block_height }
    tokens = Token.where(symbol: ['wSTX', 'DIKO', 'USDA', 'xBTC', 'auto-alex', 'STXUSDA'])
    tokens.find_each do |token|
      hsh[token.symbol.downcase] = token
    end
    render json: hsh
  end

  # Returns the DIKO supply
  def supply
    # Hardcoded for now until we can figure out how to call Clarity read-only functions from Ruby
    render json: 80,068,782.226405
  end
end
