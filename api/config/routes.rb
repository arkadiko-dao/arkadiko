Rails.application.routes.draw do
  scope '/api/v1' do
    resources :blockchains, only: [:update, :show]
    resources :pools, only: [:index, :show, :update] do
      member do
        get 'volume'
        get 'prices'
        get 'export'
      end
    end
    resources :vaults, only: [:index]
    resources :tokens, only: [:show, :update]
    resources :pages, only: :none do
      collection do
        get 'stake'
        get 'swap'
        get 'oracle'
      end
    end
  end
end
