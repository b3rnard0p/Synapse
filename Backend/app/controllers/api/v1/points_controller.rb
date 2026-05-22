module Api
  module V1
    class PointsController < ApplicationController
      REWARDS = [
        { id: 1, name: "Desconto na pipoca",   description: "20% off na pipoca grande", points_required: 100, icon: "🍿" },
        { id: 2, name: "Desconto na bebida",   description: "1 bebida grátis",          points_required: 150, icon: "🥤" },
        { id: 3, name: "Ingresso grátis",      description: "1 ingresso em qualquer sessão", points_required: 500, icon: "🎟️" },
        { id: 4, name: "Combo cinema",         description: "Pipoca + bebida + ingresso", points_required: 800, icon: "🎬" }
      ].freeze

      # GET /api/v1/points
      def index
        checkins = current_user.checkins.includes(:ticket).order(created_at: :desc)

        render json: {
          balance: current_user.points_balance,
          history: checkins.map { |c| checkin_history(c) }
        }, status: :ok
      end

      # GET /api/v1/points/rewards
      def rewards
        rewards = REWARDS.map do |reward|
          reward.merge(
            can_redeem: current_user.points_balance >= reward[:points_required]
          )
        end

        render json: {
          balance: current_user.points_balance,
          rewards:
        }, status: :ok
      end

      private

      def checkin_history(checkin)
        {
          id: checkin.id,
          movie_title: checkin.ticket.movie.title,
          points_earned: checkin.points_earned,
          checked_in_at: checkin.checked_in_at.iso8601
        }
      end
    end
  end
end
