Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      # Authentication
      post   "auth/google",  to: "auth#google_oauth"
      delete "auth/logout",  to: "auth#logout"
      get    "auth/me",      to: "auth#me"

      # Movies (TMDB proxy)
      get "movies/recommended", to: "movies#recommended"
      get "movies/upcoming",    to: "movies#upcoming"
      get "movies/now_playing", to: "movies#now_playing"
      get "movies/search",      to: "movies#search"
      get "movies/genres",      to: "movies#genres"
      get "movies/:id",         to: "movies#show"

      # People (Cast/Crew)
      resources :people, only: [ :show ]

      # Users
      resources :users, only: [ :show, :update ] do
        member do
          get  :preferences
          put  :preferences, action: :update_preferences
        end
        resources :favorites,      only: [ :index, :create, :destroy ]
        resources :notifications,  only: [ :index, :update ]
      end

      # Tickets & Wallet
      resources :tickets, only: [ :index, :create, :show ] do
        member do
          post :checkin
        end
      end

      # Points & Rewards
      get "points",         to: "points#index"
      get "points/rewards", to: "points#rewards"
    end
  end
end
