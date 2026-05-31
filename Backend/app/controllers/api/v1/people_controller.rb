module Api
  module V1
    class PeopleController < ApplicationController
      skip_before_action :authenticate_user!, only: [ :show ]

      CACHE_EXPIRY = 1.day

      # GET /api/v1/people/:id
      def show
        person_id = params[:id].to_i
        
        person = Rails.cache.fetch("person:detail:#{person_id}", expires_in: CACHE_EXPIRY) do
          TmdbService.new.person_details(person_id)
        end

        if person
          render json: person, status: :ok
        else
          render_not_found("Pessoa")
        end
      end
    end
  end
end
