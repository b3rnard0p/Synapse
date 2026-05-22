module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user!, only: [ :google_oauth ]

      # POST /api/v1/auth/google
      # Body: { id_token: "google_id_token" }
      def google_oauth
        id_token = params.require(:id_token)

        service = GoogleAuthService.new(id_token)
        user_info = service.verify!

        if user_info.nil?
          return render json: { error: service.error }, status: :unauthorized
        end

        user = find_or_create_user(user_info)
        token = JwtService.encode(user_id: user.id)

        render json: {
          token: token,
          user: Api::V1::UserSerializer.render_as_hash(user)
        }, status: :ok
      end

      # DELETE /api/v1/auth/logout
      def logout
        # JWT is stateless; client discards the token
        # Future: add token to denylist in Redis/DB
        render json: { message: "Logout realizado com sucesso" }, status: :ok
      end

      # GET /api/v1/auth/me
      def me
        render json: Api::V1::UserSerializer.render_as_hash(current_user), status: :ok
      end

      private

      def find_or_create_user(user_info)
        user = User.find_by(google_uid: user_info[:google_uid]) ||
               User.find_by(email: user_info[:email])

        if user
          user.update!(
            google_uid: user_info[:google_uid],
            avatar_url: user_info[:avatar_url],
            name: user_info[:name]
          )
        else
          user = User.create!(
            google_uid: user_info[:google_uid],
            email: user_info[:email],
            name: user_info[:name],
            avatar_url: user_info[:avatar_url],
            points_balance: 0,
            active: true
          )
        end

        user
      end
    end
  end
end
