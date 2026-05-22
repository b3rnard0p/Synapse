require "rails_helper"

RSpec.describe "Api::V1::Auth", type: :request do
  describe "POST /api/v1/auth/google" do
    let(:user_info) do
      {
        google_uid: "google_123",
        email: "test@example.com",
        name: "Test User",
        avatar_url: "https://example.com/avatar.jpg",
        email_verified: true
      }
    end

    context "with a valid Google token" do
      before do
        google_service = instance_double(GoogleAuthService, verify!: user_info, error: nil)
        allow(GoogleAuthService).to receive(:new).and_return(google_service)
      end

      it "returns 200 with token and user" do
        post "/api/v1/auth/google", params: { id_token: "valid_token" }, as: :json
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to include("token", "user")
      end

      it "creates a new user" do
        expect {
          post "/api/v1/auth/google", params: { id_token: "valid_token" }, as: :json
        }.to change(User, :count).by(1)
      end

      it "does not duplicate user on second login" do
        create(:user, google_uid: "google_123", email: "test@example.com")
        expect {
          post "/api/v1/auth/google", params: { id_token: "valid_token" }, as: :json
        }.not_to change(User, :count)
      end
    end

    context "with an invalid Google token" do
      before do
        google_service = instance_double(GoogleAuthService, verify!: nil, error: "Token inválido")
        allow(GoogleAuthService).to receive(:new).and_return(google_service)
      end

      it "returns 401" do
        post "/api/v1/auth/google", params: { id_token: "bad_token" }, as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/auth/me" do
    let(:user) { create(:user) }

    it "returns current user when authenticated" do
      get "/api/v1/auth/me", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["id"]).to eq(user.id)
    end

    it "returns 401 when not authenticated" do
      get "/api/v1/auth/me"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/v1/auth/logout" do
    let(:user) { create(:user) }

    it "returns 200" do
      delete "/api/v1/auth/logout", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
    end
  end
end
