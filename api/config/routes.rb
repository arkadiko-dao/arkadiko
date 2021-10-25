Rails.application.routes.draw do
  scope '/api/v1' do
    resources :pools, only: [:index, :show]
  end
end
