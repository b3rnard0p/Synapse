module Api
  module V1
    class MoviesController < ApplicationController
      skip_before_action :authenticate_user!, only: [ :upcoming, :now_playing, :search, :show, :genres ]

      CACHE_EXPIRY = 15.minutes

      # GET /api/v1/movies/upcoming
      def upcoming
        page = params.fetch(:page, 1).to_i
        data = Rails.cache.fetch("movies:upcoming:page:#{page}", expires_in: CACHE_EXPIRY) do
          TmdbService.new.upcoming(page:)
        end
        render json: data, status: :ok
      end

      # GET /api/v1/movies/now_playing
      def now_playing
        page = params.fetch(:page, 1).to_i
        data = Rails.cache.fetch("movies:now_playing:page:#{page}", expires_in: CACHE_EXPIRY) do
          TmdbService.new.now_playing(page:)
        end
        render json: data, status: :ok
      end

      # GET /api/v1/movies/search?q=batman
      def search
        query = params.require(:q)
        page  = params.fetch(:page, 1).to_i
        data  = TmdbService.new.search(query:, page:)
        render json: data, status: :ok
      end

      # GET /api/v1/movies/recommended
      def recommended
        page = params.fetch(:page, 1).to_i
        genre_ids = current_user.genre_ids

        if genre_ids.empty?
          render json: { results: [], total_pages: 0, total_results: 0 }, status: :ok
          return
        end

        data = Rails.cache.fetch("movies:recommended:user_#{current_user.id}:page:#{page}", expires_in: CACHE_EXPIRY) do
          TmdbService.new.discover_by_genres(genre_ids, page:)
        end

        render json: data, status: :ok
      end

      # GET /api/v1/movies/genres
      def genres
        genres = Rails.cache.fetch("movies:genres", expires_in: 1.day) do
          TmdbService.new.genres
        end
        render json: { genres: }, status: :ok
      end

      # GET /api/v1/movies/:id
      def show
        tmdb_id = params[:id].to_i
        movie = Rails.cache.fetch("movies:detail:#{tmdb_id}", expires_in: CACHE_EXPIRY) do
          TmdbService.new.movie_details(tmdb_id)
        end

        if movie
          # Append user favorite status if authenticated
          if current_user
            movie[:is_favorited] = current_user.user_favorites.exists?(
              movie_id: Movie.find_by(tmdb_id:)&.id
            )
          end
          render json: movie, status: :ok
        else
          render_not_found("Filme")
        end
      end
    end
  end
end
