class BlockchainsController < ApplicationController
  before_action :check_api_key, only: [:update]

  def show
    blockchain = Blockchain.first

    render json: blockchain
  end

  def update
    blockchain = Blockchain.first
    blockchain.vaults_tvl = params[:vaults_tvl] if params[:vaults_tvl].present?
    blockchain.swap_tvl = params[:swap_tvl] if params[:swap_tvl].present?
    blockchain.save

    render json: blockchain
  end

  private
    def check_api_key
      return head 403 unless params[:key] === ENV['API_KEY']
    end
end
