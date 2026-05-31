module Api
  module V1
    class UsersController < ApplicationController
      before_action :set_user
      before_action :authorize_user!

      # GET /api/v1/users/:id
      def show
        render json: Api::V1::UserSerializer.render_as_hash(@user), status: :ok
      end

      # PATCH /api/v1/users/:id
      def update
        if @user.update(user_update_params)
          render json: Api::V1::UserSerializer.render_as_hash(@user), status: :ok
        else
          render_unprocessable(@user.errors.full_messages)
        end
      end

      # GET /api/v1/users/:id/preferences
      def preferences
        render json: {
          preferences: @user.preferences_hash,
          genre_preferences: @user.genre_preferences.map { |gp| { id: gp.genre_id, name: gp.genre_name } }
        }, status: :ok
      end

      # PUT /api/v1/users/:id/preferences
      def update_preferences
        ActiveRecord::Base.transaction do
          prefs = params.require(:preferences).permit!

          # Update general preferences JSON if provided
          if prefs.key?(:preferences) || prefs.key?("preferences")
            @user.update!(preferences: prefs[:preferences] || prefs["preferences"])
          end

          # Update genre preferences if the key is present (even if empty)
          if !prefs[:genre_ids].nil? || !prefs["genre_ids"].nil? || !prefs[:genres].nil? || !prefs["genres"].nil?
            @user.genre_preferences.destroy_all
            genres_data = prefs[:genres] || prefs["genres"] || []
            genres_data.each do |genre|
              @user.genre_preferences.create!(
                genre_id: genre[:id] || genre["id"],
                genre_name: genre[:name] || genre["name"]
              )
            end
          end
        end

        render json: { message: "Preferências atualizadas com sucesso" }, status: :ok
      rescue StandardError => e
        render_unprocessable([ e.message ])
      end

      private

      def set_user
        @user = User.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_not_found("Usuário")
      end

      def authorize_user!
        render_unauthorized unless @user.id == current_user.id
      end

      def user_update_params
        params.require(:user).permit(:name, :avatar_url, :push_token)
      end

      def preferences_params
        params.require(:preferences).permit(
          :preferences,
          genre_ids: [],
          genres: [ :id, :name ]
        )
      end
    end
  end
end
