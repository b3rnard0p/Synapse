module Api
  module V1
    class UserSerializer < Blueprinter::Base
      identifier :id

      fields :name, :email, :avatar_url, :points_balance, :active, :push_token

      field :genre_preferences do |user|
        user.genre_preferences.map { |gp| { id: gp.genre_id, name: gp.genre_name } }
      end

      field :preferences do |user|
        user.preferences_hash
      end

      field :created_at do |user|
        user.created_at.iso8601
      end
    end
  end
end
