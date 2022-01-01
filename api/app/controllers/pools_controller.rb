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

  def prices
    @pool = Pool.find(params[:id])
    render json: {
      prices: @pool.fetch_prices
    }
  end

  def export
    @pool = Pool.find(params[:id])
    prices = @pool.export_prices
    respond_with do |format|
      format.csv do
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = 'attachment; filename=export.csv'
        render prices
      end
    end
  end
end
