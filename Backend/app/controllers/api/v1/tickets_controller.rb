module Api
  module V1
    class TicketsController < ApplicationController
      # GET /api/v1/tickets
      def index
        tickets = current_user.tickets
                              .includes(:movie)
                              .order(session_datetime: :asc)

        render json: Api::V1::TicketSerializer.render(tickets), status: :ok
      end

      # GET /api/v1/tickets/:id
      def show
        ticket = current_user.tickets.find(params[:id])
        render json: Api::V1::TicketSerializer.render_as_hash(ticket), status: :ok
      rescue ActiveRecord::RecordNotFound
        render_not_found("Ingresso")
      end

      # POST /api/v1/tickets
      # Body: { movie_id, cinema_name, session_datetime, original_price }
      def create
        movie = Movie.find_by(tmdb_id: ticket_params[:tmdb_id]) ||
                create_movie_from_tmdb(ticket_params[:tmdb_id])

        return render_not_found("Filme") unless movie

        ticket = current_user.tickets.build(
          movie: movie,
          cinema_name: ticket_params[:cinema_name],
          session_datetime: ticket_params[:session_datetime],
          original_price: ticket_params[:original_price].to_f,
          discount_percent: Ticket::DISCOUNT_PERCENT,
          status: "confirmed"
        )

        if ticket.save
          # Send purchase confirmation notification
          NotificationDispatchJob.perform_later(
            current_user.id,
            "purchase_confirmation",
            movie.id
          )

          render json: Api::V1::TicketSerializer.render_as_hash(ticket), status: :created
        else
          render_unprocessable(ticket.errors.full_messages)
        end
      end

      # POST /api/v1/tickets/:id/checkin
      def checkin
        ticket = current_user.tickets.find(params[:id])

        unless ticket.can_checkin?
          return render json: {
            error: "Check-in não disponível para este ingresso"
          }, status: :unprocessable_entity
        end

        checkin = Checkin.new(user: current_user, ticket: ticket)

        if checkin.save
          render json: {
            message: "Check-in realizado! Você ganhou #{Checkin::POINTS_EARNED} pontos.",
            points_earned: Checkin::POINTS_EARNED,
            total_points: current_user.reload.points_balance
          }, status: :ok
        else
          render_unprocessable(checkin.errors.full_messages)
        end
      rescue ActiveRecord::RecordNotFound
        render_not_found("Ingresso")
      end

      private

      def ticket_params
        params.require(:ticket).permit(:tmdb_id, :cinema_name, :session_datetime, :original_price)
      end

      def create_movie_from_tmdb(tmdb_id)
        data = TmdbService.new.movie_details(tmdb_id)
        return nil unless data

        Movie.find_or_create_from_tmdb(data)
      rescue StandardError => e
        Rails.logger.error("[Ticket] TMDB fetch failed: #{e.message}")
        nil
      end
    end
  end
end
