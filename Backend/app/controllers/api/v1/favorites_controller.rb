module Api
  module V1
    class FavoritesController < ApplicationController
      before_action :set_user

      # GET /api/v1/users/:user_id/favorites
      def index
        favorites = @user.user_favorites.includes(:movie).recent
        movies = favorites.map { |fav| fav.movie }
        render json: { favorites: movies.map { |m| movie_summary(m) } }, status: :ok
      end

      # POST /api/v1/users/:user_id/favorites
      # Body: { tmdb_id: 123 }
      def create
        movie = Movie.find_by(tmdb_id: params[:tmdb_id]) ||
                fetch_and_store_movie(params[:tmdb_id])

        return render_not_found("Filme") unless movie

        favorite = @user.user_favorites.build(movie:)

        if favorite.save
          render json: { message: "Adicionado aos favoritos", movie_id: movie.id }, status: :created
        else
          render_unprocessable(favorite.errors.full_messages)
        end
      end

      # DELETE /api/v1/users/:user_id/favorites/:id
      def destroy
        movie = Movie.find_by(tmdb_id: params[:id])
        return render_not_found("Favorito") unless movie

        favorite = @user.user_favorites.find_by(movie_id: movie.id)
        return render_not_found("Favorito") unless favorite

        favorite.destroy!
        render json: { message: "Removido dos favoritos" }, status: :ok
      end

      private

      def set_user
        @user = current_user
        render_unauthorized unless @user.id == params[:user_id].to_i
      end

      def movie_summary(movie)
        {
          id: movie.id,
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          poster_url: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
          is_upcoming: movie.is_upcoming
        }
      end

      def fetch_and_store_movie(tmdb_id)
        data = TmdbService.new.movie_details(tmdb_id)
        return nil unless data

        Movie.find_or_create_from_tmdb(data)
      rescue StandardError
        nil
      end
    end
  end
end
