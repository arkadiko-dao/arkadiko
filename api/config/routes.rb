Rails.application.routes.draw do
  scope '/api/v1' do
    resources :pools, only: [:index, :show] do
      member do
        get 'volume'
        get 'prices'
      end
    end
    resources :vaults, only: [:index]
  end
end
