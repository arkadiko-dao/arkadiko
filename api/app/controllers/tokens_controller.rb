class TokensController < ApplicationController
  def show
    if params[:id]&.downcase == 'diko'
      event = Pool.find(2).swap_events.order('event_at ASC').where("function_name IN (?)", ['swap-x-for-y', 'swap-y-for-x']).last
      render json: {
        price_in_cents: 100 * (event['token_y_amount'] / event['token_x_amount'].to_f).round(4)
      }
    else
      return head 404
    end
  end
end
