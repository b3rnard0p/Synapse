module Api
  module V1
    class TicketSerializer < Blueprinter::Base
      identifier :id

      fields :cinema_name, :status, :discount_percent, :original_price, :qr_code

      field :session_datetime do |ticket|
        ticket.session_datetime.iso8601
      end

      field :discounted_price do |ticket|
        ticket.discounted_price&.round(2)
      end

      field :is_checked_in do |ticket|
        ticket.checked_in?
      end

      field :can_checkin do |ticket|
        ticket.can_checkin?
      end

      field :movie do |ticket|
        {
          id: ticket.movie.id,
          tmdb_id: ticket.movie.tmdb_id,
          title: ticket.movie.title,
          poster_url: ticket.movie.poster_path,
          backdrop_url: ticket.movie.backdrop_path
        }
      end

      field :created_at do |ticket|
        ticket.created_at.iso8601
      end
    end
  end
end
