class PoolsController < ApplicationController
  before_action :check_api_key, only: [:update]

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

  def update
    pool = Pool.find(params[:id])
    pool.balance_x = params[:balance_x] if params[:balance_x].present?
    pool.balance_y = params[:balance_y] if params[:balance_y].present?
    pool.shares_total = params[:shares_total] if params[:shares_total].present?
    pool.enabled = params[:enabled] if params[:enabled].present?
    pool.save

    render json: pool
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
        send_data prices
      end
    end
  end

  private

    def check_api_key
      return head 403 unless params[:key] === ENV['API_KEY']
    end
end
