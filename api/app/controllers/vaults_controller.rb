class VaultsController < ApplicationController
  def index
    open_vaults = Vault.where(closed_at: nil)
    render json: {
      count: open_vaults.count,
      stx_collateral: open_vaults.pluck(:collateral_amount).sum,
      debt: open_vaults.pluck(:debt).sum
    }
  end
end
