require "rails_helper"

RSpec.describe "Api::V1::Tickets", type: :request do
  let(:user)   { create(:user) }
  let(:movie)  { create(:movie) }

  describe "GET /api/v1/tickets" do
    before { create_list(:ticket, 3, user: user, movie: movie) }

    it "returns user tickets" do
      get "/api/v1/tickets", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).length).to eq(3)
    end

    it "does not return other users' tickets" do
      other_user = create(:user)
      create(:ticket, user: other_user, movie: movie)
      get "/api/v1/tickets", headers: auth_headers(user)
      expect(JSON.parse(response.body).length).to eq(3)
    end

    it "returns 401 without authentication" do
      get "/api/v1/tickets"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/tickets" do
    let(:params) do
      {
        ticket: {
          tmdb_id: movie.tmdb_id,
          cinema_name: "Cinemark Test",
          session_datetime: 3.days.from_now.iso8601,
          original_price: 35.0
        }
      }
    end

    it "creates a ticket" do
      expect {
        post "/api/v1/tickets", params: params, headers: auth_headers(user), as: :json
      }.to change(Ticket, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it "returns ticket with QR code data" do
      post "/api/v1/tickets", params: params, headers: auth_headers(user), as: :json
      body = JSON.parse(response.body)
      expect(body).to include("id", "cinema_name", "discount_percent", "movie")
    end

    it "applies 20% discount" do
      post "/api/v1/tickets", params: params, headers: auth_headers(user), as: :json
      body = JSON.parse(response.body)
      expect(body["discount_percent"]).to eq(20)
      expect(body["discounted_price"].to_f).to eq(28.0)
    end
  end

  describe "POST /api/v1/tickets/:id/checkin" do
    context "when ticket is valid for check-in" do
      let(:ticket) { create(:ticket, :today, user: user, movie: movie, status: "confirmed") }

      it "performs check-in and awards points" do
        post "/api/v1/tickets/#{ticket.id}/checkin", headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body["points_earned"]).to eq(50)
        expect(user.reload.points_balance).to eq(50)
      end

      it "marks ticket as used" do
        post "/api/v1/tickets/#{ticket.id}/checkin", headers: auth_headers(user)
        expect(ticket.reload.status).to eq("used")
      end
    end

    context "when ticket is not for today" do
      let(:ticket) { create(:ticket, :upcoming, user: user, movie: movie) }

      it "returns 422" do
        post "/api/v1/tickets/#{ticket.id}/checkin", headers: auth_headers(user)
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end
end
