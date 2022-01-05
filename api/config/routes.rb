Rails.application.routes.draw do
  scope '/api/v1' do
    resources :pools, only: [:index, :show] do
      member do
        get 'volume'
        get 'prices'
        get 'export'
      end
    end
    resources :vaults, only: [:index]
    resources :tokens, only: [:show]
    resources :pages, only: [:stake]
  end
end
