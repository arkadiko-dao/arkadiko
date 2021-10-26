class PoolsController < ApplicationController
  def index
    @pools = Pool.all.page(params[:page] || 1).per(25)

    render json: {
      pools: @pools
    }
  end

  def show
    @pool = Pool.find(params[:id])
    
    render json: {
      pool: @pool
    }
  end

  def volume
    @pool = Pool.find(params[:id])
    if params[:period] == '7'
      volume = @pool.volume_7d
    else
      volume = @pool.volume_24h
    end

    render json: {
      volume: volume
    }
  end
end
