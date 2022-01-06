class TokensController < ApplicationController
  before_action :check_api_key, only: [:update]

  def show
    token = Token.find_by('lower(symbol) = ?', params[:id].downcase)
    return head 401 if token.nil?

    pool = find_pool(token)
    event = pool.swap_events.order('event_at ASC').where("function_name IN (?)", ['swap-x-for-y', 'swap-y-for-x']).last
    render json: {
      token: token,
      price_in_cents: 100 * (event['token_y_amount'] / event['token_x_amount'].to_f).round(4)
    }
  end

  def update
    token = Token.find_by('lower(symbol) = ?', params[:id].downcase)
    token.total_supply = params[:total_supply] if params[:total_supply].present?
    token.last_price = params[:last_price] if params[:last_price].present?
    token.price_last_updated = params[:price_last_updated] if params[:price_last_updated].present?
    token.total_staked = params[:total_staked] if params[:total_staked].present?
    token.save

    render json: token
  end

  private

    def find_pool(token)
      if token.symbol == 'DIKO'
        Pool.find(2)
      elsif token.symbol == 'STX'
        Pool.find(1)
      end
    end

    def check_api_key
      return head 403 unless params[:key] === ENV['API_KEY']
    end
end
