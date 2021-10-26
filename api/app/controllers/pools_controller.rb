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
end
